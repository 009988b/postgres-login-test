import React from 'react';
import './App.css';
import Login from './components/Login/Login';
import Member from './components/Member/Member';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";

function App() {
  return (
    <div className="App">
        <Router>
            <Switch>
                <Route path="/login">
                    <Login />
                </Route>
                <Route path="/">
                    <Member />
                </Route>
            </Switch>
        </Router>
    </div>
  );
}

export default App;
