
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};

exports.client = function(req, res){
	res.render('client', { title: 'I am a worker' });
}