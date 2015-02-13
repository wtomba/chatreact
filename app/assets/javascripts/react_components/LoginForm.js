var LoginForm = React.createClass({
  componentDidMount: function () {
    $(".title").text("Logga in / Registrera");
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
          localStorage.setItem("user", JSON.stringify({token: data.access_token, username: data.username}));
          React.unmountComponentAtNode(document.getElementById("main-section"));
          React.render(
            <ChatBox url="/conversations" conversation_id="" />,
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
  render: function () {
    return (
      <form className="commentForm small-12 medium-10 large-6 large-offset-3 medium-offset-1 columns" onSubmit={this.handleSubmit}>
        <fieldset>
          <br />
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
              <input className="button tiny success right" type="submit" value="Logga in / Registrera" />
            </div>
          </div>
        </fieldset>
      </form>
    );
  }
});
