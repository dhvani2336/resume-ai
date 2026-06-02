export const uploadFile = (req, res, next) => {
  try {
    // If multer file filter or limit didn't fire an error, but no file was provided in form data
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded.'
      });
    }

    // Success response with file metadata
    return res.status(200).json({
      success: true,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    next(error);
  }
};
