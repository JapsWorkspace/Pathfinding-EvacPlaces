const fetch = require("node-fetch");

exports.route = async (req, res) => {
  const { start, end, mode } = req.body;

  const url =
    `https://router.project-osrm.org/route/v1/${mode}/` +
    `${start.lng},${start.lat};${end.lng},${end.lat}` +
    `?alternatives=true&overview=full&geometries=geojson`;

  const r = await fetch(url);
  const json = await r.json();

  res.json(json);
};