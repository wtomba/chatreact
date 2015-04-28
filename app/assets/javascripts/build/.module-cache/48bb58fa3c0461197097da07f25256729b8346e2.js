var RegistrationForm = React.createClass({displayName: "RegistrationForm",	
  componentDidMount: function () {
    $(".title").text("Registrera");
    $(".left-small").hide();
    $(".right-small").hide();
  },
  handleSubmit: function (e) {
    e.preventDefault();
    var username = this.refs.username.getDOMNode().value.trim(),
		password = this.refs.password.getDOMNode().value.trim(),
		password_confirmation = this.refs.password_confirmation.getDOMNode().value.trim();

    if (!username || !password || !password_confirmation) {
      return;
    }

    if (password !== password_confirmation) {
    	$(".error-field").html('<span class="label alert errorMessage">Lösenordsfälten stämmer inte överrens</span>');
    	return;
    }

    $.ajax({
      url: '/register',
      dataType: 'json',
      type: 'POST',
      data: {username: username, password: password, password_confirmation: password_confirmation},
      success: function (data) {
        if (data.access_token) {
          localStorage.setItem("user", JSON.stringify({token: data.access_token, username: data.username, id: data.id, notification_sounds: data.notification_sounds }));

          var io = io.connect("http://192.168.186.128:5001");
          io.emit('join', { id: data.id });
          io.on("rt-change", function (message) {
            $(document).trigger(message.resource);
          });

          React.unmountComponentAtNode(document.getElementById("main-section"));
          React.render(
            React.createElement(ChatBox, {url: "/conversations", conversation_id: ""}),
            document.getElementById("main-section")
          );
        } else {
          $(".error-field").html('<span class="label alert errorMessage">'+ data.message +'</span>');
        }
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
    });

    this.refs.password.getDOMNode().value = "";
    this.refs.password_confirmation.getDOMNode().value = "";
  },
  handleLogin: function () {
		React.unmountComponentAtNode(document.getElementById("main-section"));
		React.render(
			React.createElement(LoginForm, null),
			document.getElementById("main-section")
		);
  },
  render: function () {
    return (
      React.createElement("form", {className: "loginForm small-12 medium-10 large-8 medium-centered large-centred columns", onSubmit: this.handleSubmit}, 
        React.createElement("div", {className: "row icon"}, 
          React.createElement("i", {className: "fi-page-edit"})
        ), 
        React.createElement("div", {className: "row"}, 
          React.createElement("div", {className: "error-field small-12 large-12 columns"}
          )
        ), 
        React.createElement("div", {className: "row"}, 
          React.createElement("div", {className: "name-field small-12 large-12 columns"}, 
            React.createElement("label", null, "Ange ditt användarnamn", 
              React.createElement("input", {type: "text", placeholder: "Användarnamn", ref: "username", required: true})
            )
          )
        ), 
        React.createElement("div", {className: "row"}, 
          React.createElement("div", {className: "text-field small-12 large-12 columns"}, 
            React.createElement("label", null, "Ange ditt lösenord", 
              React.createElement("input", {type: "password", placeholder: "Lösenord", ref: "password", required: true})
            )
          )
        ), 
        React.createElement("div", {className: "row"}, 
          React.createElement("div", {className: "text-field small-12 large-12 columns"}, 
            React.createElement("label", null, "Bekräfta lösenord", 
              React.createElement("input", {type: "password", placeholder: "Bekräfta lösenord", ref: "password_confirmation", required: true})
            )
          )
        ), 
        React.createElement("div", {className: "row"}, 
          React.createElement("div", {className: "small-12 large-12 columns"}, 
            React.createElement("input", {className: "button tiny secondary left", onClick: this.handleLogin, value: "Tillbaka till login"}), 
            React.createElement("input", {className: "button tiny success right", type: "submit", value: "Registrera"})
          )
        )
      )
    );
  }
});