import React from 'react';
import './App.css';
import Login from './components/Login/Login';
import Home from './components/Home/Home';
import Register from './components/Register/Register';
import Reset from './components/Reset/Reset';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";

function App() {
  return (
    <div className="App">
        <Router>
            <Switch>
                <Route path="/login">
                    <Login />
                </Route>
                <Route path="/reset-password">
                    <Reset />
                </Route>
                <Route path="/register">
                    <Register />
                </Route>
                <Route path="/" >
                    <Home />
                </Route>
            </Switch>
        </Router>
    </div>
  );
}

export default App;
