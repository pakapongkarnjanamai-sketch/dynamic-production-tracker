function internalServerError(res, err, context) {
  if (context) {
    console.error(`[${context}]`, err);
  } else {
    console.error(err);
  }

  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = {
  internalServerError,
};
