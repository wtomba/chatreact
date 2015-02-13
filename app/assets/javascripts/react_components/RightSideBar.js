var RightSideBar = React.createClass({
  getInitialState: function () {
    var user = JSON.parse(localStorage.getItem('user'));

    return {
      conversations: [],
      user: user,
    };
  },
  componentDidMount: function () {
    this.getConversations();

    $(document).on('conversation', this.getConversations);
  },
  componentWillUnmount: function () {
    $(document).off('conversation');
  },
  getConversations: function () {
      $.ajax({
        url: 'all_conversations',
        dataType: 'json',
        type: 'GET',
        success: function (data) {
          this.setState({conversations: data.conversations});
        }.bind(this),
        error: function (xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this),
        beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Token token=" + this.state.user.token);
        }.bind(this),
      });
  },
  openConversation: function (id) {
    React.unmountComponentAtNode(document.getElementById("main-section"));
    React.render(
      <ChatBox url="/conversations" id={id} />,
      document.getElementById("main-section")
    );

    $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-left');
  },
  render: function () {
    return (
      <div>
        <ul className="off-canvas-list">
          <li><label>Konversationer</label></li>
          <ConversationList conversations={this.state.conversations} openConversation={this.openConversation} />
        </ul>
      </div>
    );
  },
});

var ConversationList = React.createClass({
  handleClick: function (i, e) {
    e.preventDefault();

    var id = this.props.conversations[i].id;

    if(!id) {
      return;
    }
    this.props.openConversation(id);
  },
  render: function () {
    var listNodes = this.props.conversations.map(function (conversation, i) {
      return (
        <li key={conversation.id}>
          <a href="#" onClick={this.handleClick.bind(this, i)}>
            <ConversationUsers users={conversation.users} />
          </a>
        </li>
      );
    }, this);
    return (
      <div>
        {listNodes}
      </div>
    );
  },
});

var ConversationUsers = React.createClass({
  render: function () {
    return (
      <span>
        {this.props.users.map(function (user, i){
          return (
            <User user={user} />
          );
        })}
      </span>
    );
  }
});

var User = React.createClass({
  render: function () {
    return (
      <span>{this.props.user.username}, </span>
    );
  }
});
