var LoginForm = React.createClass({
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
          localStorage.setItem("user", JSON.stringify({token: data.access_token, username: data.username, id: data.id, notification_sounds: data.notification_sounds }));

          React.unmountComponentAtNode(document.getElementById("main-section"));
          React.render(
            <ChatBox url="/conversations" conversation_id="" />,
            document.getElementById("main-section")
          );
          var io = io.connect("http://85.230.152.217:5001");
          // var io = window.io.connect("http://192.168.186.128:5001");
          io.emit('join', { id: data.id });
          io.on("rt-change", function (message) {
            $(document).trigger(message.resource);
          });
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
      <RegistrationForm />,
      document.getElementById("main-section")
    );
  },
  render: function () {
    return (
      <form className="loginForm small-12 medium-10 large-8 medium-centered large-centred columns" onSubmit={this.handleSubmit}>
        <div className="row icon">
          <i className="fi-unlock"></i>
        </div>
        <div className="row">
          <div className="error-field small-12 large-12 columns">
          </div>
        </div>
        <div className="row">
          <div className="name-field small-12 large-12 columns">
            <label>Ange ditt användarnamn
              <input type="text" placeholder="Användarnamn" ref="username" required />
            </label>
          </div>
        </div>
        <div className="row">
          <div className="text-field small-12 large-12 columns">
            <label>Ange ditt lösenord
              <input type="password" placeholder="Lösenord" ref="password" required />
            </label>
          </div>
        </div>
        <div className="row">
          <div className="small-12 large-12 columns">
            <button className="button tiny secondary left" onClick={this.handleRegistration}>Registrera</button>
            <button className="button tiny success right" type="submit">Logga in</button>
          </div>
        </div>
      </form>
    );
  }
});
