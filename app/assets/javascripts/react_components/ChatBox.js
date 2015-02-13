var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var ChatBox = React.createClass({
  getInitialState: function () {
    var user = JSON.parse(localStorage.getItem('user'));
    return {messages: [],
            conversation: {
              users: []
            },
            user: user};
  },
  componentDidMount: function () {
    $(".title").text("Chatta");
    $(".left-small").show();
    $(".right-small").show();
    this.loadMessagesFromServer();

    React.render(
      <LeftSideBar />,
      document.getElementById("left-side-bar")
    );

    React.render(
      <RightSideBar />,
      document.getElementById("right-side-bar")
    );

    $(document).on('message', this.loadMessagesFromServer);
  },
  componentWillUnmount: function () {
    $(document).off('message');
    React.unmountComponentAtNode(document.getElementById("left-side-bar"));
    React.unmountComponentAtNode(document.getElementById("right-side-bar"));
  },
  loadMessagesFromServer: function () {
    var url = this.props.url;

    if (this.props.id) {
      url += "/"+this.props.id;
    }

    $.ajax({
      url: url,
      dataType: 'json',
      success: function (data) {
        if (data.conversation) {
          this.setState({messages: data.messages,
                          conversation: data.conversation});
          $("#messages").animate({ scrollTop: $('#messages')[0].scrollHeight}, 500);
          this.props.id = data.conversation.id;
        } else {
          this.setState({messages: [{
            user: {
              username: "Server"
            },
            text: "Starta en konversation genom att navigera till menyn uppe till vänster och välj sedan en vän att prata med.",
            created_at: Date.now(),
          }]});

          $("#submit").attr('disabled', true);
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
  handleMessageSubmit: function (message) {
    $.ajax({
      url: this.props.url+"/" +this.props.id,
      dataType: 'json',
      type: 'POST',
      data: message,
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
  handleMessageRemove: function (message) {
    $.ajax({
      url: '/messages',
      dataType: 'json',
      type: 'DELETE',
      data: {id: message},
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
  render: function () {
    return (
      <section role="main">
        <div className="row">
          <AttendeeList attendees={this.state.conversation.users} current_user={this.state.user} />
          <MessageList messages={this.state.messages} handleMessageRemove={this.handleMessageRemove} current_user={this.state.user} />
          <MessageForm onMessageSubmit={this.handleMessageSubmit} />
        </div>
      </section>
    );
  }
});

var MessageList = React.createClass({
  handleRemove: function (i, e) {
    e.preventDefault();

    var messageToRemove = this.props.messages[i].id;

    if (!messageToRemove) {
      return;
    }

    this.props.handleMessageRemove(messageToRemove);
  },
  render: function () {
    var messageNodes = this.props.messages.map(function (message, i) {
      return (
        <Message author={message.user} user={this.props.current_user} created_at={message.created_at} id={message.id} key={message.id} removeMessage={this.handleRemove.bind(this, i)}>
          {message.text}
        </Message>
      )
    }, this);
    return (
      <div id="messages">
        <ReactCSSTransitionGroup transitionName="message">
          {messageNodes}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
});

var Message = React.createClass({

  render: function () {
    var date = new Date(this.props.created_at);
    var formatted_date = (date.getMonth() + 1)+"/"+
                            date.getDate()+"/"+
                              date.getFullYear()+" - "+
                              (date.getHours() > 9 ? date.getHours() : "0"+date.getHours())+":"+
                                (date.getMinutes() > 9 ? date.getMinutes() : "0"+date.getMinutes());

    // Current user is owner of message
    if (this.props.user.username === this.props.author.username) {
      return (
        <div>
          <div data-alert className="alert-box transparent right">
            <a href="#" className="close" onClick={this.props.removeMessage}><i className="fi-trash"></i></a>
          </div>
          <div data-alert className="alert-box transparent right">
            <a href="#" className="close" ><i className="fi-widget"></i></a>
          </div>
          <blockquote className="active">
            {this.props.children}
            <cite><span className="author active">{this.props.author.username}</span> ({formatted_date})</cite>
          </blockquote>
        </div>
      );
    } else {
      return (
        <div>
          <blockquote>
            {this.props.children}
            <cite><span className="author">{this.props.author.username}</span> ({formatted_date})</cite>
          </blockquote>
        </div>
      );
    }
  }
});

var AttendeeList = React.createClass({
  render: function () {
    var current_user = this.props.current_user;
    var attendeeNodes = this.props.attendees.map(function (attendee, i) {
      if (current_user.username === attendee.username){
        return (
          <span className="active label" key={attendee.id}>{attendee.username}</span>
        );
      } else {
        return (
          <span className="label">{attendee.username}</span>
        );
      }
    });
    return (
      <div id="attendees">
        <ReactCSSTransitionGroup transitionName="message">
          {attendeeNodes}
        </ReactCSSTransitionGroup>
      </div>
    );
  }
});

var MessageForm = React.createClass({
  handleSubmit: function (e) {
    e.preventDefault();
    var text = this.refs.text.getDOMNode().value.trim();

    if (!text) {
      return;
    }

    this.props.onMessageSubmit({text: text });
    this.refs.text.getDOMNode().value = "";
  },
  render: function () {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <fieldset>
          <div className="row">
            <div className="text-field small-12 large-12 columns">
              <label>Skriv ditt meddelande
                <textarea placeholder="Din meddelande här" ref="text" required rows="3"></textarea>
              </label>
            </div>
          </div>
          <div className="row">
            <div className="small-12 large-12 columns">
              <input id="submit" className="button tiny success right" type="submit" value="Skicka" />
            </div>
          </div>
        </fieldset>
      </form>
    );
  }
});
