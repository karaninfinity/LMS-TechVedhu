export const uploadMedia = async (req, res) => {
  const { file } = req;

  console.log(file);
  const media = req.file.path.replace("\\", "/");

  res.json({
    message: "Media uploaded successfully",
    path: media,
  });
};
