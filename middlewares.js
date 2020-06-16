const notFound = (req,res,next) => {
	const error = new Error(`Not FOund = ${req.originalUrl}`);
	res.status(404);
	next(error);
};


const errorHandler = (error,req,res,next) => {
	const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
	res.status(statusCode);
	console.log(error.stack);
	res.json({
		message: error.message,
		stack: process.env.NODE_ENV === 'Production' ? 'Stack' : error.stack
	});
};

module.exports = {
	notFound,
	errorHandler
};