
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Control Panel' })
};

exports.client = function(req, res){
	res.render('client', { title: 'I am a worker' });
}

exports.about = function(req, res) {
	res.render('about', {title: "About Node Reduce"});
}