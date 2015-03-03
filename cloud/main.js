// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:
AV.Cloud.define("hello", function(request, response) {
	var name = request.params.name;
	if (name) {
		response.success('Hello ' + name +'!');
	} else {
		response.error('what your name?')
	}
});