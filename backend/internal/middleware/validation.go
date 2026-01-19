package middleware

import "github.com/go-playground/validator/v10"

var validate = validator.New()

func ValidateRequest(obj interface{}) error {
	return validate.Struct(obj)
}
