import React from 'react';
import PropTypes from 'prop-types';
import { TransitionGroup, CSSTransition } from 'react-transition-group';


const ESC = 27;

class ModalContainer extends React.Component {
  static propTypes = {
    currentModal: PropTypes.func,
    close: PropTypes.func,
    transitionName: PropTypes.string,
    enterDuration: PropTypes.number.isRequired,
    exitDuration: PropTypes.number.isRequired
  };

  static defaultProps = { transitionName: 'modal', enterDuration: 190, exitDuration: 190 };

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.keyCode === ESC) {
      this.props.close();
    }
  };

  render() {
    const content = this.props.currentModal ? (
      <CSSTransition
        classNames={this.props.transitionName}
        timeout={{ enter: this.props.enterDuration, exit: this.props.exitDuration}}
        >
        <div className='fixed top-0 left-0 bottom-0 right-0'>
          <div className='absolute top-0 left-0 w-100 h-100 bg-black-50' onClick={this.props.close} />
          <div className='w-100 h-100 flex items-center justify-center'>
            {this.props.currentModal(this.props)}
          </div>
        </div>
      </CSSTransition>
    ) : null;

    return (
      <TransitionGroup>
        {content}
      </TransitionGroup>
    );
  }
}


export default ModalContainer;
