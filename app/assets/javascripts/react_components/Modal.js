window.MyDialog = React.createClass({
    propTypes: {
        title:      React.PropTypes.string.isRequired,
        content:    React.PropTypes.string.isRequired
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
            return React.renderComponent(
                MyDialog(props),
                $anchor.get(0)
            );
        },

        // close a dialog
        close: function() {
          React.unmountComponentAtNode($('#dialog-anchor').get(0));
        }
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
          MyDialog.close();
        }
    },

    closeHandler: function () {
      MyDialog.close();
    },

    // Extremely basic dialog dom layout - use your own
    render: function() {
      return (
        <div>
          <div id="modal-bg" onClick={this.closeHandler}></div>
          <div className="modal small-9 medium-6 large-3 columns">
              <div className="title-bar">
                  <div className="title">
                    <h3>
                      {this.props.title}
                      <div data-alert className="alert-box transparent right">
                        <a href="#" className="close" onClick={this.closeHandler} ><i className="fi-x"></i></a>
                      </div>
                    </h3>
                  </div>
              </div>
              <div className="content">
                  {this.props.content}
              </div>
          </div>
        </div>
      )
    }
});
