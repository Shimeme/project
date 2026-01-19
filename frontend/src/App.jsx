import React, { useState, useEffect } from 'react';
import { Scroll, Coins, Sparkles, Trash2, Check, Plus, Upload, PawPrint } from 'lucide-react';


const GuildQuest = () => {
  const [currentPage, setCurrentPage] = useState('quests');
  const [tasks, setTasks] = useState([]);
  const [gold, setGold] = useState(0);
  const [pet, setPet] = useState({
    type: 'dragon',
    level: 1,
    hunger: 100,
    happiness: 100,
    exp: 0
  });
  const [decorations, setDecorations] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', reward: 10 });
  const [bulkTaskText, setBulkTaskText] = useState('');
  const [showGuildmaster, setShowGuildmaster] = useState(false);
  const [guildmasterMessage, setGuildmasterMessage] = useState('');

  
useEffect(() => {
  const loadData = async () => {
    try {
      // Пытаемся загрузить с бэка
      const [tasksRes, petRes] = await Promise.all([getTasks(), getPet()]);
      setTasks(tasksRes.data || []);
      setPet(petRes.data || pet);
      setGold(petRes.data?.gold || 0);
      setDecorations(petRes.data?.decorations || []);
    } catch (err) {
      console.warn('Backend unavailable, loading from localStorage', err);
      // fallback на localStorage
      const savedData = localStorage.getItem('guildquest_data');
      if (savedData) {
        const data = JSON.parse(savedData);
        setTasks(data.tasks || []);
        setGold(data.gold || 0);
        setPet(data.pet || pet);
        setDecorations(data.decorations || []);
      }
    }
  };

  loadData();
}, []);
 
useEffect(() => {
  const saveData = async () => {
    const data = { tasks, gold, pet, decorations };
    
    // 1️⃣ Сохраняем локально
    localStorage.setItem('guildquest_data', JSON.stringify(data));

    // 2️⃣ Пытаемся синхронизировать с бэком
    try {
      // Синхронизация задач
      await Promise.all(tasks.map(task => 
        task.id < 0 
          ? createTask(task)        // новые задачи
          : apiCompleteTask(task)   // или апдейт существующих
      ));

      // Синхронизация питомца
      await apiFeedPet(pet); // или другой эндпоинт updatePet
    } catch (err) {
      console.warn('Failed to sync with backend', err);
    }
  };

  saveData();
}, [tasks, gold, pet, decorations]);
  useEffect(() => {
    const interval = setInterval(() => {
      setPet(prev => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 1),
        happiness: Math.max(0, prev.happiness - 0.5)
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const showGuildmasterComment = (message) => {
    setGuildmasterMessage(message);
    setShowGuildmaster(true);
    setTimeout(() => setShowGuildmaster(false), 3000);
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task = {
      id: Date.now(),
      ...newTask,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, task]);
    setNewTask({ title: '', description: '', reward: 10 });
    showGuildmasterComment('A new quest has been posted!');
  };

  const addBulkTasks = () => {
    if (!bulkTaskText.trim()) return;
    const lines = bulkTaskText.split('\n').filter(line => line.trim());
    const newTasks = lines.map((line, index) => {
      const match = line.match(/^\d+\.\s*(.+)/);
      const title = match ? match[1] : line;
      return {
        id: Date.now() + index,
        title: title.trim(),
        description: '',
        reward: 10,
        completed: false,
        createdAt: new Date().toISOString()
      };
    });
    setTasks([...tasks, ...newTasks]);
    setBulkTaskText('');
    showGuildmasterComment(`${newTasks.length} quests added to the board!`);
  };

  const completeTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return;
    
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: true } : t));
    setGold(gold + task.reward);
    
    setPet(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 5),
      exp: prev.exp + 10
    }));

    if (pet.exp + 10 >= pet.level * 100) {
      setPet(prev => ({
        ...prev,
        level: prev.level + 1,
        exp: 0
      }));
      showGuildmasterComment('Quest complete! Your companion grows stronger!');
    } else {
      showGuildmasterComment('Well done, adventurer! Gold earned!');
    }
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const feedPet = () => {
    const cost = 20;
    if (gold < cost) {
      showGuildmasterComment('Not enough gold, adventurer!');
      return;
    }
    setGold(gold - cost);
    setPet(prev => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 30),
      happiness: Math.min(100, prev.happiness + 10)
    }));
    showGuildmasterComment('Your companion is well fed!');
  };

  const playWithPet = () => {
    setPet(prev => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 20),
      hunger: Math.max(0, prev.hunger - 5)
    }));
    showGuildmasterComment('Your companion enjoyed that!');
  };

  const buyDecoration = (decoration) => {
    const cost = 50;
    if (gold < cost) {
      showGuildmasterComment('Not enough gold for decorations!');
      return;
    }
    if (decorations.includes(decoration)) {
      showGuildmasterComment('You already own this decoration!');
      return;
    }
    setGold(gold - cost);
    setDecorations([...decorations, decoration]);
    showGuildmasterComment('Chamber decorated beautifully!');
  };

  return (
    // --- USE THE NEW TAILWIND CLASS INSTEAD OF INLINE STYLE ---
    <div className="w-full min-h-screen relative font-serif bg-my-wood">
      {/* Wooden Header */}
      <nav className="relative z-10 bg-gradient-to-r from-[#6d4423] via-[#8B5A2B] to-[#6d4423] border-b-4 border-[#4a2e19] shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Scroll className="w-12 h-12 text-[#fdf6e3] drop-shadow-lg" strokeWidth={1.5} />
            <h1 className="text-5xl font-bold tracking-wide text-[#fdf6e3] drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
              GuildQuest
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative px-6 py-3 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg shadow-xl border-2 border-yellow-700">
              <Coins className="w-6 h-6 text-yellow-900 inline mr-2" strokeWidth={2} />
              <span className="text-2xl font-bold text-yellow-950">{gold}</span>
            </div>
            <button
              onClick={() => setCurrentPage('quests')}
              className={`px-5 py-3 rounded-lg font-semibold shadow-lg transition-all border-2 ${
                currentPage === 'quests'
                  ? 'bg-[#6d4423] border-[#4a2e19] text-[#fdf6e3] shadow-inner'
                  : 'bg-[#8B5A2B] border-[#6d4423] text-[#fdf6e3] hover:bg-[#6d4423]'
              }`}
            >
              <Scroll className="w-5 h-5 inline mr-2" strokeWidth={1.5} />
              Quest Board
            </button>
            <button
              onClick={() => setCurrentPage('pet')}
              className={`px-5 py-3 rounded-lg font-semibold shadow-lg transition-all border-2 ${
                currentPage === 'pet'
                  ? 'bg-[#6d4423] border-[#4a2e19] text-[#fdf6e3] shadow-inner'
                  : 'bg-[#8B5A2B] border-[#6d4423] text-[#fdf6e3] hover:bg-[#6d4423]'
              }`}
            >
              <PawPrint className="w-5 h-5 inline mr-2" strokeWidth={1.5} />
              Pet Chamber
            </button>
          </div>
        </div>
      </nav>

      {/* Guildmaster Message on Parchment */}
      {showGuildmaster && (
        <div className="fixed top-24 right-8 z-50 bg-[#fdf6e3] bg-paper-texture border-4 border-[#8B5A2B] rounded-lg shadow-2xl p-5 animate-bounce">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#8B5A2B] to-[#6d4423] rounded-full flex items-center justify-center text-2xl border-2 border-[#4a2e19] shadow-inner">
              🧙
            </div>
            <div>
              <p className="text-xs font-bold mb-1 text-[#6d4423] uppercase tracking-wider">
                Guildmaster
              </p>
              <p className="text-sm text-[#4a2e19]">
                {guildmasterMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 pb-16">
        {currentPage === 'quests' ? (
          <QuestBoard
            tasks={tasks}
            newTask={newTask}
            setNewTask={setNewTask}
            bulkTaskText={bulkTaskText}
            setBulkTaskText={setBulkTaskText}
            addTask={addTask}
            addBulkTasks={addBulkTasks}
            completeTask={completeTask}
            deleteTask={deleteTask}
          />
        ) : (
          <PetChamber
            pet={pet}
            decorations={decorations}
            gold={gold}
            feedPet={feedPet}
            playWithPet={playWithPet}
            buyDecoration={buyDecoration}
          />
        )}
      </div>
    </div>
  );
};
// ... The rest of the file (QuestBoard, PetChamber) remains the same
// (Make sure to include the rest of your components here)
const QuestBoard = ({ tasks, newTask, setNewTask, bulkTaskText, setBulkTaskText, addTask, addBulkTasks, completeTask, deleteTask }) => {
  const [showBulkInput, setShowBulkInput] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* "Post New Quest" Parchment */}
      <div className="lg:col-span-1">
        <div className="bg-[#fdf6e3] bg-paper-texture rounded-lg shadow-2xl border-4 border-[#8B5A2B] relative p-8 shadow-inner">
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-full shadow-xl border-2 border-red-950 flex items-center justify-center text-2xl text-white">📌</div>
          
          <h2 className="text-3xl font-bold mb-6 pb-3 text-[#4a2e19] border-b-2 border-[#8B5A2B]">
            Post New Quest
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-[#6d4423]">
                Quest Title
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#fffbf2] bg-paper-texture border-2 border-[#b9956f] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] text-[#4a2e19]"
                placeholder="Slay the dragon..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-[#6d4423]">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-3 bg-[#fffbf2] bg-paper-texture border-2 border-[#b9956f] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] h-24 resize-none text-[#4a2e19]"
                placeholder="Quest details..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-[#6d4423]">
                Reward (Gold)
              </label>
              <input
                type="number"
                value={newTask.reward}
                onChange={(e) => setNewTask({ ...newTask, reward: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-[#fffbf2] bg-paper-texture border-2 border-[#b9956f] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] text-[#4a2e19]"
                min="1"
              />
            </div>
            
            {/* Wax Seal Button */}
            <button
              onClick={addTask}
              className="w-full bg-gradient-to-br from-red-700 to-red-900 text-yellow-50 py-4 rounded-lg font-bold shadow-xl hover:from-red-600 hover:to-red-800 transition-all border-2 border-red-950"
            >
              <Plus className="w-5 h-5 inline mr-2" strokeWidth={2} />
              Add Quest
            </button>

            <button
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="w-full bg-gradient-to-br from-[#8B5A2B] to-[#6d4423] text-yellow-50 py-3 rounded-lg font-semibold shadow-lg hover:from-[#6d4423] hover:to-[#5a381a] transition-all border-2 border-[#4a2e19]"
            >
              <Upload className="w-4 h-4 inline mr-2" strokeWidth={2} />
              Bulk Add Quests
            </button>

            {showBulkInput && (
              <div className="mt-4 p-4 bg-[#fffbf2] rounded-lg border-2 border-dashed border-[#b9956f]">
                <label className="block text-sm font-bold mb-2 text-[#6d4423]">
                  Paste numbered list (e.g., "1. Task one")
                </label>
                <textarea
                  value={bulkTaskText}
                  onChange={(e) => setBulkTaskText(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fffbf2] bg-paper-texture border-2 border-[#b9956f] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] h-32 resize-none text-[#4a2e19]"
                  placeholder="1. First quest"
                />
                <button
                  onClick={addBulkTasks}
                  className="w-full mt-3 bg-gradient-to-br from-green-600 to-green-800 text-green-50 py-3 rounded-lg font-semibold shadow-lg hover:from-green-500 hover:to-green-700 transition-all border-2 border-green-900"
                >
                  Import Quests
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "Active Quests" Main Parchment */}
      <div className="lg:col-span-2">
        <div className="bg-[#fdf6e3] bg-paper-texture rounded-lg shadow-2xl border-4 border-[#8B5A2B] p-8 shadow-inner">
          <h2 className="text-4xl font-bold mb-8 pb-4 text-[#4a2e19] border-b-2 border-[#8B5A2B] flex items-center gap-4">
            <Scroll className="w-10 h-10" strokeWidth={1.5} />
            Active Quests
          </h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {tasks.length === 0 ? (
              <div className="text-center py-16">
                <Scroll className="w-20 h-20 mx-auto mb-4 opacity-20 text-[#6d4423]" strokeWidth={1} />
                <p className="text-xl text-[#6d4423] italic">
                  The quest board awaits your first posting...
                </p>
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-5 rounded-lg shadow-lg transition-all border-2 ${
                    task.completed 
                      ? 'bg-green-100 border-green-700 opacity-75'
                      : 'bg-[#fffbf2] bg-paper-texture border-[#b9956f] hover:shadow-xl hover:border-[#8B5A2B]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => completeTask(task.id)}
                          disabled={task.completed}
                          className={`mt-1 flex-shrink-0 w-7 h-7 rounded border-2 flex items-center justify-center transition-all ${
                            task.completed 
                              ? 'bg-gradient-to-br from-green-600 to-green-800 border-green-900 shadow-inner'
                              : 'bg-[#fffbf2] border-[#8B5A2B] hover:bg-yellow-100 shadow-sm'
                          }`}
                        >
                          {task.completed && <Check className="w-5 h-5 text-green-50" strokeWidth={3} />}
                        </button>
                        <div className="flex-1">
                          <h3 className={`text-xl font-bold mb-1 ${task.completed ? 'line-through text-gray-500' : 'text-[#4a2e19]'}`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm mb-3 text-[#6d4423] leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-md border border-yellow-700">
                              <Coins className="w-4 h-4 text-yellow-950" strokeWidth={2} />
                              <span className="font-bold text-yellow-950">
                                {task.reward}
                              </span>
                            </div>
                            {task.completed && (
                              <span className="text-xs font-bold px-3 py-1 bg-gradient-to-br from-green-600 to-green-800 text-green-50 rounded-lg border border-green-900 shadow-md">
                                ✓ COMPLETED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-700 hover:text-red-900 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PetChamber = ({ pet, decorations, gold, feedPet, playWithPet, buyDecoration }) => {
  const availableDecorations = ['torch', 'banner', 'shield', 'chest', 'bookshelf', 'armor'];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-lg shadow-2xl border-4 border-[#4a2e19] relative min-h-[500px] overflow-hidden">
          {/* Stone wall texture */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
          <div className="absolute inset-4 border-4 border-amber-700 opacity-30 rounded pointer-events-none"></div>

          <div className="absolute top-6 left-6 flex gap-3 z-10">
            {decorations.includes('torch') && <span className="text-5xl drop-shadow-2xl">🔥</span>}
            {decorations.includes('banner') && <span className="text-5xl drop-shadow-2xl">🚩</span>}
          </div>
          <div className="absolute top-6 right-6 flex gap-3 z-10">
            {decorations.includes('shield') && <span className="text-5xl drop-shadow-2xl">🛡️</span>}
            {decorations.includes('armor') && <span className="text-5xl drop-shadow-2xl">⚔️</span>}
          </div>
          <div className="absolute bottom-6 left-6 flex gap-3 z-10">
            {decorations.includes('chest') && <span className="text-5xl drop-shadow-2xl">📦</span>}
            {decorations.includes('bookshelf') && <span className="text-5xl drop-shadow-2xl">📚</span>}
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="text-9xl mb-6 animate-bounce drop-shadow-2xl">🐉</div>
              <div className="inline-block px-8 py-4 bg-[#fdf6e3] bg-paper-texture rounded-lg shadow-2xl border-4 border-[#8B5A2B]">
                <h2 className="text-3xl font-bold mb-3 text-[#4a2e19]">
                  Level {pet.level} {pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#6d4423]">
                    Experience
                  </span>
                  <div className="w-40 h-4 bg-[#6d4423] rounded-full overflow-hidden shadow-inner border-2 border-[#4a2e19]">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 transition-all shadow-lg"
                      style={{ width: `${(pet.exp / (pet.level * 100)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <button
            onClick={feedPet}
            className="bg-gradient-to-br from-green-600 to-green-800 text-green-50 py-5 rounded-lg font-bold shadow-xl hover:from-green-500 hover:to-green-700 transition-all border-2 border-green-900 text-lg"
          >
            <Sparkles className="w-6 h-6 inline mr-2" strokeWidth={2} />
            Feed Pet (20 Gold)
          </button>
          <button
            onClick={playWithPet}
            className="bg-gradient-to-br from-blue-600 to-blue-800 text-blue-50 py-5 rounded-lg font-bold shadow-xl hover:from-blue-500 hover:to-blue-700 transition-all border-2 border-blue-900 text-lg"
          >
            <PawPrint className="w-6 h-6 inline mr-2" strokeWidth={2} />
            Play with Pet (Free)
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#fdf6e3] bg-paper-texture rounded-lg shadow-2xl border-4 border-[#8B5A2B] p-6 shadow-inner">
          <h3 className="text-2xl font-bold mb-5 pb-3 text-[#4a2e19] border-b-2 border-[#8B5A2B]">
            Companion Status
          </h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-[#6d4423]">
                  Hunger
                </span>
                <span className="text-sm font-bold text-[#6d4423]">
                  {Math.round(pet.hunger)}%
                </span>
              </div>
              <div className="w-full h-5 bg-[#6d4423] rounded-full overflow-hidden shadow-inner border-2 border-[#4a2e19]">
                <div
                  className={`h-full transition-all ${
                    pet.hunger > 50 ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : pet.hunger > 25 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  style={{ width: `${pet.hunger}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-[#6d4423]">
                  Happiness
                </span>
                <span className="text-sm font-bold text-[#6d4423]">
                  {Math.round(pet.happiness)}%
                </span>
              </div>
              <div className="w-full h-5 bg-[#6d4423] rounded-full overflow-hidden shadow-inner border-2 border-[#4a2e19]">
                <div
                  className={`h-full transition-all ${
                    pet.happiness > 50 ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : pet.happiness > 25 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  style={{ width: `${pet.happiness}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#fdf6e3] bg-paper-texture rounded-lg shadow-2xl border-4 border-[#8B5A2B] p-6 shadow-inner">
          <h3 className="text-2xl font-bold mb-5 pb-3 text-[#4a2e19] border-b-2 border-[#8B5A2B]">
            Decoration Shop
          </h3>
          <div className="space-y-3">
            {availableDecorations.map(deco => (
              <button
                key={deco}
                onClick={() => buyDecoration(deco)}
                disabled={decorations.includes(deco) || gold < 50}
                className={`w-full py-3 px-4 rounded-lg font-semibold shadow-lg transition-all border-2 ${
                  decorations.includes(deco)
                    ? 'bg-gray-300 border-gray-600 text-gray-700 cursor-not-allowed opacity-75'
                    : gold < 50
                    ? 'bg-[#d4b896] border-[#8B5A2B] text-gray-500 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-br from-[#8B5A2B] to-[#6d4423] border-[#4a2e19] text-[#fdf6e-3] hover:from-[#6d4423] hover:to-[#5a381a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize text-lg">{deco}</span>
                  <span className="flex items-center gap-1 font-bold">
                    {decorations.includes(deco) ? (
                      <span className="text-sm">✓ Owned</span>
                    ) : (
                      <>
                        <span>50</span>
                        <Coins className="w-4 h-4" strokeWidth={2} />
                      </>
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuildQuest;
