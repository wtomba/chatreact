window.ConversationNameModal = React.createClass({displayName: "ConversationNameModal",
    propTypes: {
        title:      React.PropTypes.string.isRequired,
        name: 		React.PropTypes.string.isRequired,
        id: 		React.PropTypes.number.isRequired,
    },
    statics: {

        // open a dialog with props object as props
        open: function(props) {
            var $anchor = $('#dialog-anchor');

            if (!$anchor.length) {
                $anchor = $('<div></div>')
                    .prop('id', 'dialog-anchor')
                    .appendTo('body');
            }

            React.render(
                React.createElement(ConversationNameModal, {title: props.title, name: props.name, id: props.id}),
                $anchor.get(0)
            );


            var wrap = $(".off-canvas-wrap"),
                modal = $(".modal");

            TweenMax.to($("#modal-bg"), 0.75, { background: "rgba(0, 0, 0, .75)" })
            
            TweenMax.set(modal, {height: "auto", width: wrap.width() - 40, top: "15%" });
            TweenMax.from(modal, 1, { top: -$(".modal").height(), height: 0, width: wrap.width() - 40, ease: Elastic.easeOut });
        },

        // close a dialog
        close: function() {
          React.unmountComponentAtNode($('#dialog-anchor').get(0));
        }
    },
    
    getInitialState: function () {
      var user = JSON.parse(localStorage.getItem('user'));

      return {
        user: user,
        animation_running: false,
      };
    },

    // when dialog opens, add a keyup event handler to body
    componentDidMount: function() {
        $('body').on('keyup.myDialog', this.globalKeyupHandler);
    },

    // when dialog closes, clean up the bound keyup event handler on body
    componentWillUnmount: function() {
        $('body').off('keyup.myDialog');
    },

    // handles keyup events on body
    globalKeyupHandler: function(e) {
        if (e.keyCode == 27) { // ESC key
          ConversationNameModal.close();
        }
    },

    closeHandler: function () {
      var button = $(".conversation."+this.props.id),
          wrap = $("#inner-container"),
          modal = $(".modal"),
          modalHeight = modal.height(),
          padding = 20;

        if (!this.state.animation_running) {
        	this.setState({ animation_running: true });

        TweenMax.set($("#modal-bg"), { background: "rgba(0, 0, 0, 0)" });
        TweenMax.from($("#modal-bg"), 0.75, { background: "rgba(0, 0, 0, 0.75)" });

		    TweenMax.set(modal, { left: wrap.offset().left + padding, width: wrap.outerWidth() - padding*2, top: -$(".modal").height(), height: 0 });
		    TweenMax.from(modal, 1, { left: wrap.offset().left + padding, width: wrap.outerWidth() - padding*2, height: modalHeight, top: "15%", ease: Sine.easeOut, onComplete: function () {
				this.setState({ animation_running: false });
		    	ConversationNameModal.close();
		    }.bind(this) });
        }
    },
    handleNameChange: function (e) {
    	e.preventDefault();

    	var name = this.refs.name.getDOMNode().value.trim();

    	if (!name) {
    		return;
    	}

	    $.ajax({
	      url: '/conversations/' + this.props.id + "/change_name",
	      dataType: 'json',
	      type: 'POST',
	      data: {name: name},
	      success: function (data) {
	      	if (data.message === "success") {
	      		this.closeHandler();
	      	} else {
          		$(".error-field").html('<span class="label alert errorMessage">'+ data.message +'</span>');
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
    render: function() {
      return (
        React.createElement("div", null, 
          React.createElement("div", {id: "modal-bg", onClick: this.closeHandler}), 
          React.createElement("div", {className: "modal"}, 
            React.createElement("div", {className: "large-12 columns header"}, 
              React.createElement("i", {className: "fi-wrench left"}), 
              React.createElement("span", null, this.props.title), 
              React.createElement("i", {onClick: this.closeHandler, className: "fi-x right close"})
            ), 
            React.createElement("div", {className: "large-12 columns"}, 
            	React.createElement("form", {onSubmit: this.handleNameChange}, 
					React.createElement("div", {className: "error-field small-12 large-12 columns"}
					), 
                	React.createElement("input", {type: "text", className: "name-input", placeholder: this.props.name, ref: "name", required: true}), 
            		React.createElement("input", {className: "button tiny success right", type: "submit", value: "Ändra"})
                )
            )
          )
        )
      )
    }
});