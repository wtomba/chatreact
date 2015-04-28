var user = JSON.parse(localStorage.getItem('user'));
if (user && user.token) {
	React.render(
	React.createElement(ChatBox, {url: "/conversations"}),
	document.getElementById("main-section")
	);

	var io = io.connect("http://192.168.186.128:5001");
	io.emit('join', { id: user.id });
	io.on("rt-change", function (message) {
		$(document).trigger(message.resource);
	});
	
} else {
	React.render(
		React.createElement(LoginForm, null),
		document.getElementById("main-section")
	);
}