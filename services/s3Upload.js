const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');
const multer = require('multer');

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey
  },
  region: 'ap-south-1'
});

// For SignUp image uploads --------------------------------------------------------------------

function checkImageType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
};

const storage = multer.memoryStorage();

const uploadSignup = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
      checkImageType(file, cb);
    }
});

const generateUniqueFileName = (originalName) => {
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  const uniqueSuffix = crypto.randomBytes(8).toString('hex');
  return `${baseName}-${uniqueSuffix}${ext}`;
};

const uploadFileToS3 = async (file, folderName) => {
  const uniqueFileName = generateUniqueFileName(file.originalname);
  const params = {
    Bucket: 'sprinter-kidiloski',
    Key: `${folderName}/${uniqueFileName}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  const uploadImgToS3Command = new PutObjectCommand(params);
  await s3.send(uploadImgToS3Command);

  return `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
};

// For file uploads in item ---------------------------------------------------------------

function checkItemFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log("Got the file........");
    return cb(null, true);
  } else {
    cb('Error: Invalid file type!');
    console.log("Invalid file type!");
  }
};

const uploadItemFiles = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    checkItemFileType(file, cb);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});

module.exports = {
  uploadSignup,
  uploadFileToS3,

  uploadItemFiles
};
