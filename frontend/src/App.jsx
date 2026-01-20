
import React, { useState, useEffect } from 'react';
import { Scroll, Coins, Sparkles, Trash2, Check, Plus, Upload, PawPrint, LogOut } from 'lucide-react';
import Auth from './components/Auth';
import { getTasks, createTask, completeTask as apiCompleteTask, deleteTask as apiDeleteTask, createBulkTasks } from './api/tasks';
import { getPet, feedPet as apiFeedPet, playWithPet as apiPlayWithPet } from './api/pet';
import { getDecorations, buyDecoration as apiBuyDecoration } from './api/decorations';

const GuildQuest = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
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

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('guildquest_token');
    const savedUser = localStorage.getItem('guildquest_user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Load data from backend when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      try {
        const [tasksRes, petRes, decorationsRes] = await Promise.all([
          getTasks(),
          getPet(),
          getDecorations()
        ]);

        setTasks(tasksRes || []);
        setPet(petRes || pet);
        setDecorations(decorationsRes || []);
        
        const savedUser = JSON.parse(localStorage.getItem('guildquest_user'));
        setGold(savedUser?.gold || 0);
      } catch (err) {
        console.error('Failed to load data from backend:', err);
        showGuildmasterComment('Failed to connect to the Guild Hall!');
      }
    };

    loadData();
  }, [isAuthenticated]);

  // Pet hunger/happiness decay
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setPet(prev => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 1),
        happiness: Math.max(0, prev.happiness - 0.5)
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setGold(userData.gold);
    setIsAuthenticated(true);
    showGuildmasterComment(`Welcome, ${userData.email.split('@')[0]}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('guildquest_token');
    localStorage.removeItem('guildquest_refresh_token');
    localStorage.removeItem('guildquest_user');
    setIsAuthenticated(false);
    setUser(null);
    setTasks([]);
    setGold(0);
    setPet({ type: 'dragon', level: 1, hunger: 100, happiness: 100, exp: 0 });
    setDecorations([]);
  };

  const showGuildmasterComment = (message) => {
    setGuildmasterMessage(message);
    setShowGuildmaster(true);
    setTimeout(() => setShowGuildmaster(false), 3000);
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      const response = await createTask({
        title: newTask.title,
        description: newTask.description,
        reward: newTask.reward
      });
      
      setTasks([...tasks, response]);
      setNewTask({ title: '', description: '', reward: 10 });
      showGuildmasterComment('A new quest has been posted!');
    } catch (err) {
      console.error('Failed to create task:', err);
      showGuildmasterComment('Failed to post quest!');
    }
  };

  const addBulkTasks = async () => {
    if (!bulkTaskText.trim()) return;
    
    const lines = bulkTaskText.split('\n').filter(line => line.trim());
    const taskList = lines.map(line => {
      const match = line.match(/^\d+\.\s*(.+)/);
      const title = match ? match[1] : line;
      return {
        title: title.trim(),
        description: '',
        reward: 10
      };
    });

    try {
      const response = await createBulkTasks(taskList);
      setTasks([...tasks, ...response]);
      setBulkTaskText('');
      showGuildmasterComment(`${response.length} quests added to the board!`);
    } catch (err) {
      console.error('Failed to create bulk tasks:', err);
      showGuildmasterComment('Failed to add quests!');
    }
  };

  

const completeTask = async (id) => {
  const task = tasks.find(t => t.id === id);
  if (!task || task.completed) return;

  try {
    const response = await apiCompleteTask(id);

    // Update task in state
    setTasks(prev =>
      prev.map(t => (t.id === id ? response : t))
    );

    // Refresh pet data
    const petRes = await getPet();
    setPet(petRes);

    // Update gold
    const userData = JSON.parse(localStorage.getItem('guildquest_user'));
    const newGold = userData.gold + task.reward;
    setGold(newGold);
    userData.gold = newGold;
    localStorage.setItem('guildquest_user', JSON.stringify(userData));

    if (petRes.level > pet.level) {
      showGuildmasterComment('Quest complete! Your companion grows stronger!');
    } else {
      showGuildmasterComment('Well done, adventurer! Gold earned!');
    }
  } catch (err) {
    console.error('Failed to complete task:', err);
    showGuildmasterComment('Failed to complete quest!');
  }
};
  const deleteTask = async (id) => {
    try {
      await apiDeleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
      showGuildmasterComment('Quest removed from board!');
    } catch (err) {
      console.error('Failed to delete task:', err);
      showGuildmasterComment('Failed to remove quest!');
    }
  };

  const feedPet = async () => {
    const cost = 20;
    if (gold < cost) {
      showGuildmasterComment('Not enough gold, adventurer!');
      return;
    }

    try {
      const response = await apiFeedPet();
      setPet(response);
      
      const newGold = gold - cost;
      setGold(newGold);
      
      const userData = JSON.parse(localStorage.getItem('guildquest_user'));
      userData.gold = newGold;
      localStorage.setItem('guildquest_user', JSON.stringify(userData));
      
      showGuildmasterComment('Your companion is well fed!');
    } catch (err) {
      console.error('Failed to feed pet:', err);
      showGuildmasterComment(err.response?.error || 'Failed to feed pet!');
    }
  };

  const playWithPet = async () => {
    try {
      const response = await apiPlayWithPet();
      setPet(response);
      showGuildmasterComment('Your companion enjoyed that!');
    } catch (err) {
      console.error('Failed to play with pet:', err);
      showGuildmasterComment('Failed to play with pet!');
    }
  };

  const buyDecoration = async (decoration) => {
    const cost = 50;
    if (gold < cost) {
      showGuildmasterComment('Not enough gold for decorations!');
      return;
    }
    if (decorations.some(d => d.decoration === decoration)) {
      showGuildmasterComment('You already own this decoration!');
      return;
    }

    try {
      await apiBuyDecoration(decoration);
      
      const newGold = gold - cost;
      setGold(newGold);
      setDecorations([...decorations, { decoration }]);
      
      const userData = JSON.parse(localStorage.getItem('guildquest_user'));
      userData.gold = newGold;
      localStorage.setItem('guildquest_user', JSON.stringify(userData));
      
      showGuildmasterComment('Chamber decorated beautifully!');
    } catch (err) {
      console.error('Failed to buy decoration:', err);
      showGuildmasterComment(err.respons?.error || 'Failed to purchase decoration!');
    }
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="w-full min-h-screen relative font-serif bg-my-wood">
      <nav className="relative z-10 bg-gradient-to-r from-[#6d4423] via-[#8B5A2B] to-[#6d4423] border-b-4 border-[#4a2e19] shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Scroll className="w-12 h-12 text-[#fdf6e3] drop-shadow-lg" strokeWidth={1.5} />
            <h1 className="text-5xl font-bold tracking-wide text-[#fdf6e3] drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
              GuildQuest
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-[#fdf6e3] text-sm hidden md:block">
              <span className="opacity-75">Adventurer:</span>
              <span className="ml-2 font-bold">{user?.email?.split('@')[0]}</span>
            </div>
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
            <button
              onClick={handleLogout}
              className="px-5 py-3 rounded-lg font-semibold shadow-lg transition-all border-2 bg-red-800 border-red-950 text-[#fdf6e3] hover:bg-red-700"
              title="Logout"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {showGuildmaster && (
        <div className="fixed top-24 right-8 z-50 bg-[#fdf6e3] bg-paper-texture border-4 border-[#8B5A2B] rounded-lg shadow-2xl p-5 animate-bounce">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#8B5A2B] to-[#6d4423] rounded-full flex items-center justify-center text-2xl border-2 border-[#4a2e19] shadow-inner">
              ðŸ§™
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
            decorations={decorations.map(d => d.decoration || d)}
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

const QuestBoard = ({ tasks, newTask, setNewTask, bulkTaskText, setBulkTaskText, addTask, addBulkTasks, completeTask, deleteTask }) => {
  const [showBulkInput, setShowBulkInput] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-[#fdf6e3] bg-paper-texture rounded-lg shadow-2xl border-4 border-[#8B5A2B] relative p-8 shadow-inner">
          <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-red-700 to-red-900 rounded-full shadow-xl border-2 border-red-950 flex items-center justify-center text-2xl text-white">ðŸ“Œ</div>
          
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
                  placeholder="1. First quest&#10;2. Second quest&#10;3. Third quest"
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
                                âœ“ COMPLETED
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
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
          <div className="absolute inset-4 border-4 border-amber-700 opacity-30 rounded pointer-events-none"></div>

          <div className="absolute top-6 left-6 flex gap-3 z-10">
            {decorations.includes('torch') && <span className="text-5xl drop-shadow-2xl">ðŸ”¥</span>}
            {decorations.includes('banner') && <span className="text-5xl drop-shadow-2xl">ðŸš©</span>}
          </div>
          <div className="absolute top-6 right-6 flex gap-3 z-10">
            {decorations.includes('shield') && <span className="text-5xl drop-shadow-2xl">ðŸ›¡ï¸</span>}
            {decorations.includes('armor') && <span className="text-5xl drop-shadow-2xl">âš”ï¸</span>}
          </div>
          <div className="absolute bottom-6 left-6 flex gap-3 z-10">
            {decorations.includes('chest') && <span className="text-5xl drop-shadow-2xl">ðŸ“¦</span>}
            {decorations.includes('bookshelf') && <span className="text-5xl drop-shadow-2xl">ðŸ“š</span>}
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="text-9xl mb-6 animate-bounce drop-shadow-2xl">ðŸ‰</div>
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
                    : 'bg-gradient-to-br from-[#8B5A2B] to-[#6d4423] border-[#4a2e19] text-[#fdf6e3] hover:from-[#6d4423] hover:to-[#5a381a]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize text-lg">{deco}</span>
                  <span className="flex items-center gap-1 font-bold">
                    {decorations.includes(deco) ? (
                      <span className="text-sm">âœ“ Owned</span>
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

