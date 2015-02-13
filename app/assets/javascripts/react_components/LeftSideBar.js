var LeftSideBar = React.createClass({
  getInitialState: function () {
    var user = JSON.parse(localStorage.getItem('user'));

    return {
      user: user,
      user_users: [],
      users: []
    };
  },
  componentDidMount: function () {
    this.getUserConnectionsFromServer();


    $(document).on('user', this.getUserConnectionsFromServer);
  },
  componentWillUnmount: function () {
    $(document).off('user');
  },
  getUserConnectionsFromServer: function (e) {
    $.ajax({
      url: '/loadSideBarContent/',
      dataType: 'json',
      type: 'GET',
      success: function (data) {
        this.setState({user_users: data});
        $(document).foundation();
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
      }.bind(this),
    });
  },
  logOut: function (e) {
    e.preventDefault();

    localStorage.removeItem('user');
    React.unmountComponentAtNode(document.getElementById("main-section"));
    $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-right');
    React.render(
      <LoginForm />,
      document.getElementById("main-section")
    );
  },
  getPeople: function (e) {
    e.preventDefault();
    $.ajax({
      url: '/users/',
      dataType: 'json',
      type: 'GET',
      success: function (data) {
        var html = <UsersList users={data} addUser={this.addUser} />;
        MyDialog.open({title: 'Lägg till vän', content: html});
      }.bind(this),
      error: function (xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
      }.bind(this),
    });
  },
  addUser: function (userToAdd) {
      $.ajax({
        url: '/users/connection',
        dataType: 'json',
        type: 'POST',
        data: {id: userToAdd},
        success: function (data) {
          // Nothing needed here because updates are handeled through websockets
          MyDialog.close();
        }.bind(this),
        error: function (xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this),
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
        }.bind(this),
      });
  },
  removeUser: function (userToRemove) {
      $.ajax({
        url: '/users/connection',
        dataType: 'json',
        type: 'DELETE',
        data: {id: userToRemove},
        success: function (data) {
          // Nothing needed here because updates are handeled through websockets
        }.bind(this),
        error: function (xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this),
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
        }.bind(this),
      });
  },
  createConversation: function (user) {
      $.ajax({
        url: '/conversations',
        dataType: 'json',
        type: 'POST',
        data: {id: user},
        success: function (data) {
          if (data.id) {
            React.unmountComponentAtNode(document.getElementById("main-section"));
            React.render(
              <ChatBox url="/conversations" id={data.id} />,
              document.getElementById("main-section")
            );

            $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-right');
          }
        }.bind(this),
        error: function (xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this),
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
        }.bind(this),
      });
  },
  render: function () {
    return (
      <div>
        <ul className="off-canvas-list">
          <li><label>Du</label></li>
          <li>
            <a href="#" className="profile-name" data-dropdown={"drop"+this.state.user.id} aria-controls={"drop"+this.state.user.id} aria-expanded="false">{this.state.user.username}</a>
            <ul id={"drop"+this.state.user.id} data-dropdown-content className="f-dropdown" aria-hidden="true" tabindex="-1">
              <li><a href="#" onClick={this.logOut}>Logga ut</a></li>
            </ul>
          </li>
          <li><label>Dina vänner</label></li>
          <ConnectionList users={this.state.user_users} removeUser={this.removeUser} createConversation={this.createConversation} />
          <li><a href="#" onClick={this.getPeople}>Lägg till...</a></li>
        </ul>
      </div>
    );
  }
});

var ConnectionList = React.createClass({
  handleRemoveClick: function (i, e) {
    e.preventDefault();

    var userToRemove = this.props.users[i].id;

    if (!userToRemove) {
      return;
    }

    this.props.removeUser(userToRemove);
  },
  handleCreateConversationClick: function (i, e) {
    e.preventDefault();

    var user = this.props.users[i].id;

    if (!user) {
      return;
    }

    this.props.createConversation(user);
  },
  render: function () {
    var listNodes = this.props.users.map(function (user, i) {
      return (
        <li key={user.id}>
          <a href="#" data-dropdown={"drop"+user.id} aria-controls={"drop"+user.id} aria-expanded="false">{user.username}</a>
          <ul id={"drop"+user.id} data-dropdown-content className="f-dropdown" aria-hidden="true" tabindex="-1">
            <li><a href="#" onClick={this.handleCreateConversationClick.bind(this, i)}>Skapa konversation</a></li>
            <li><a href="#" onClick={this.handleRemoveClick.bind(this, i)}>Ta bort</a></li>
          </ul>
        </li>
      );
    }, this);
    return (
      <div id="connections">
        <ReactCSSTransitionGroup transitionName="message">
          {listNodes}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
});

var UsersList = React.createClass({
  handleClick: function (i, e) {
    e.preventDefault();

    var userToAdd = this.props.users[i].id;

    if (!userToAdd) {
      return;
    }

    this.props.addUser(userToAdd);
  },
  render: function () {
    var users = this.props.users.map(function (user, i) {
                  return (
                    <li>
                      <a href="#" onClick={this.handleClick.bind(this, i)} key={i}>{user.username}</a>
                    </li>
                  );
                }, this);
    if (users.length === 0) {
      users = (
        <li>
          Inga användare
        </li>
      );
    }
    return (
      <ul>
        {users}
      </ul>
    );
  }
});
