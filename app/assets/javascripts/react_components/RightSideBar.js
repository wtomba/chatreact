var RightSideBar = React.createClass({
  getInitialState: function () {
    var user = JSON.parse(localStorage.getItem('user'));

    return {
      conversations: [],
      notifications: [],
      user: user,
      interval: "",
      activeNotification: false,
      notification: new Audio('assets/react_components/notification.mp3'),
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
          this.setState({conversations: data.conversations,
                          notifications: data.notifications});


          if (data.notifications.length > 0) {
            $(".right-off-canvas-toggle i").css("color", "rgb(60, 187, 17)");

            if (JSON.parse(localStorage.getItem('user')).notification_sounds) {
              this.state.notification.play();
            }

            if (!this.state.activeNotification) {
              this.setState({
                activeNotification: true,
                interval: window.setInterval(function() {
                              document.title = document.title == "ReactTest" ? "Nytt meddelande" : "ReactTest";
                           }, 1500),
              });
            }
          } else {
            $(".right-off-canvas-toggle i").css("color", "#FFF");
            document.title = "ReactTest";

            clearInterval(this.state.interval);
            this.setState({
              activeNotification: false,
              interval: "",
            });
          }
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
    $(document).trigger("message", [id]);
    var that = this;
    setTimeout(function () {
      that.getConversations();
    }, 200);
    $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-left');
  },
  leaveConversation: function (id) {
      $.ajax({
        url: 'conversations/'+id,
        dataType: 'json',
        type: 'DELETE',
        success: function (data) {          
          $(document).trigger("message", ["leave"]);
          $('.off-canvas-wrap').foundation('offcanvas', 'toggle', 'move-left');
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
          <ConversationList conversations={this.state.conversations} notifications={this.state.notifications} openConversation={this.openConversation} leaveConversation={this.leaveConversation} />
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
      return;
    }

    this.props.leaveConversation(id);
  },
  editConversationName: function (i, e) {
    e.preventDefault();

    var id = this.props.conversations[i].id,
        name = this.props.conversations[i].name;

    if (!id || !name) {
      return;
    }

    ConversationNameModal.open({ title: "Ändra namn", name: name, id: id });
  },
  render: function () {
    var listNodes = this.props.conversations.map(function (conversation, i) {
      var notifications = [];
      for (var d = this.props.notifications.length - 1; d >= 0; d--) {
        if (this.props.notifications[d].id == conversation.id)
        {
          notifications = this.props.notifications[d].notifications;
        }
      };
      return (
        <li ref="conversation" key={conversation.id} className={$(".active-conversation").attr("id") == conversation.id ? "active conversation " + conversation.id : "conversation " + conversation.id}>
          <a href="#" onClick={this.openConversation.bind(this, i)}><span className="notifications"><span>{notifications.length}</span></span> {conversation.name}</a>
          <a href="#" className="settings" data-dropdown={"drop"+conversation.id} aria-controls={"drop"+conversation.id} aria-expanded="false" data-options="align:left;">
            <i className="fi-widget"></i>
          </a> 
          <ul id={"drop"+conversation.id} data-dropdown-content className="f-dropdown" aria-hidden="true" tabIndex="-1">
            <li><a href="#" className="text-center change-conversation-name" onClick={this.editConversationName.bind(this, i)}><i className="fi-wrench left"></i> Ändra namn</a></li>
            <li><a href="#" className="text-center" onClick={this.leaveConversation.bind(this, i)}><i className="fi-x left"></i> Lämna</a></li>
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
