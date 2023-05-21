const compose = {
    response(message = null, data = null, errors = []) {
      return {
        message,
        data,
        errors,
        date: new Date(),
      };
    },
  };
  
  module.exports = compose;
  