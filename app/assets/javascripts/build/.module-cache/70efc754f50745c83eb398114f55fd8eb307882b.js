var LoginForm = React.createClass({displayName: "LoginForm",
  componentDidMount: function () {
    $(".title").text("Logga in");
    $(".left-small").hide();
    $(".right-small").hide();
  },
  handleSubmit: function (e) {
    e.preventDefault();
    var username = this.refs.username.getDOMNode().value.trim();
    var password = this.refs.password.getDOMNode().value.trim();

    if (!username || !password) {
      return;
    }

    $.ajax({
      url: '/login',
      dataType: 'json',
      type: 'POST',
      data: {username: username, password: password},
      success: function (data) {
        if (data.access_token) {
          console.log(data);
          localStorage.setItem("user", JSON.stringify({token: data.access_token, username: data.username, id: data.id, notification_sounds: data.notification_sounds }));
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
  },
  handleRegistration: function () {
    React.unmountComponentAtNode(document.getElementById("main-section"));
    React.render(
      React.createElement(RegistrationForm, null),
      document.getElementById("main-section")
    );
  },
  render: function () {
    return (
      React.createElement("form", {className: "loginForm small-12 medium-10 large-8 medium-centered large-centred columns", onSubmit: this.handleSubmit}, 
        React.createElement("div", {className: "row icon"}, 
          React.createElement("i", {className: "fi-unlock"})
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
          React.createElement("div", {className: "small-12 large-12 columns"}, 
            React.createElement("button", {className: "button tiny secondary left", onClick: this.handleRegistration}, "Registrera"), 
            React.createElement("button", {className: "button tiny success right", type: "submit"}, "Logga in")
          )
        )
      )
    );
  }
});
