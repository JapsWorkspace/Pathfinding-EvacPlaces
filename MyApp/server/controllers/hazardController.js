exports.getHazards = async (req, res) => {
  // Example only — replace with DB later
  res.json([
    {
      lat: 15.3395,
      lng: 120.918,
      radius: 80,
      type: "FLOOD",
    },
    {
      lat: 15.337,
      lng: 120.916,
      radius: 100,
      type: "FIRE",
    },
  ]);
};