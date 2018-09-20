import React from 'react';
import PropTypes from 'prop-types';
import Greeting from './Greeting';
import './styles.css';

class App extends React.Component {
  static propTypes = {
    dpapp: PropTypes.object.isRequired,
  };

  state = {
    me: null,
  };

  componentDidMount() {
    const { dpapp } = this.props;
    dpapp.context.getMe().then(me => this.setState({ me }));
  }

  render() {
    const { me } = this.state;
    return me ? <p>Loading...</p> : <p>Hello, {me.name}!</p>;
  }
}

export default App;
