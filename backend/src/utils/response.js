const ok = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const fail = (res, statusCode = 500, message = 'Error') => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  ok,
  fail
};
