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
  openConversation: function (id) {
    React.unmountComponentAtNode(document.getElementById("main-section"));
    React.render(
      <ChatBox url="/conversations" id={id} />,
      document.getElementById("main-section")
    );

    $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-left');
  },
  leaveConversation: function (id) {
      $.ajax({
        url: 'conversations/'+id,
        dataType: 'json',
        type: 'DELETE',
        success: function (data) {
          React.unmountComponentAtNode(document.getElementById("main-section"));
          React.render(
            <ChatBox url="/conversations" />,
            document.getElementById("main-section")
          );
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
          <li><label>Konversationer</label></li>
          <ConversationList conversations={this.state.conversations} openConversation={this.openConversation} leaveConversation={this.leaveConversation} />
        </ul>
      </div>
    );
  },
});

var ConversationList = React.createClass({
  openConversation: function (i, e) {
    e.preventDefault();

    var id = this.props.conversations[i].id,
        children = this.getDOMNode().childNodes[0].childNodes;

    if(!id) {
      return;
    }


    for (var p = 0; p < children.length; p++) {
      if (children[p].className == "active") {
        children[p].className = "";
      }
    }
    children[i].className = "active";
    this.props.openConversation(id);
  },
  leaveConversation: function (i, e) {
    e.preventDefault();

    var id = this.props.conversations[i].id;

    if (!id) {

    }

    this.props.leaveConversation(id);
  },
  render: function () {
    var listNodes = this.props.conversations.map(function (conversation, i) {
      return (
        <li ref="conversation" key={conversation.id} className={i == 0 ? "active" : ""}>
          <a href="#" data-dropdown-init data-dropdown={"dropconv"+conversation.id} aria-controls={"dropconv"+conversation.id} aria-expanded="false">
            <ConversationUsers users={conversation.users} />
          </a>
          <ul id={"dropconv"+conversation.id} data-dropdown-content className="f-dropdown" aria-hidden="true" tabindex="-1">
            <li><a href="#" onClick={this.openConversation.bind(this, i)}>Öppna</a></li>
            <li><a href="#" onClick={this.leaveConversation.bind(this, i)}>Lämna</a></li>
          </ul>
        </li>
      );
    }, this);
    return (
      <div id="conversations">
        <ReactCSSTransitionGroup transitionName="message">
          {listNodes}
        </ReactCSSTransitionGroup>
      </div>
    );
  },
});

var ConversationUsers = React.createClass({
  render: function () {
    var length = this.props.users.length;
    return (
      <span>
        {this.props.users.map(function (user, i){
          return (
            <User user={user} i={i + 1} length={length} />
          );
        })}
      </span>
    );
  }
});

var User = React.createClass({
  render: function () {
    return (
      <span>{this.props.user.username}{this.props.i < this.props.length ? ", " : ""}</span>
    );
  }
});
