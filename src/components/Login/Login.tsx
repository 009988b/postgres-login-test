import React from 'react';
import { Redirect } from 'react-router-dom';
import './Login.css';
import '../../tailwind.output.css';
import axios from 'axios';
import auth from "../../Auth";

export default function Login() {
    const parseJwt = (token: any) => {
        if (token) {
            let base64Url = token.split('.')[1];
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            let payload = decodeURIComponent(atob(base64).split('').map((c) => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(payload);
        }
        else {
            console.error('Token is ' + token);
        }
    };

    const sendData = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSending) return;
        setIsSending(true);
        const payload = {
            'username' : username,
            'password' : password
        }
        const response = await axios.post("http://localhost:5000/user/auth", payload, {
            headers: {
                'Content-Type': 'application/json',
            }});
        setStatus("sent")
        console.log(response);
        let newtoken = JSON.parse(response.request.response).token;
        if (newtoken) {
            auth.token = newtoken;
            auth.acc_name = parseJwt(newtoken).username;
            localStorage.setItem('jwt', auth.token);
            console.log("setting token" + auth.token)
            localStorage.setItem('username', auth.acc_name);
            setStatus("logged")
        }
        setIsSending(false)
    }

    const isAuth = () => {
        console.log("Already logged in? " + localStorage.getItem('username') + '\n' + auth.token);
        if (!localStorage.getItem('jwt')) {
            setLoading(false);
        } else {
            //Users must login, this code will not check existing token
            if (status === 'sent') {
                axios.get("http://localhost:5000/user/isauth", {
                    headers: {
                        authorization: 'Bearer ' + auth.token
                    }
                }).then(res => {
                    if (res.status === 200) {
                        setStatus("sent");
                        setLoading(false);
                    } else if (res.status === 401) {
                        setStatus("initial");
                        setLoading(false);
                    }
                }).catch(e => {
                    console.error(e);
                    setLoading(false);
                })
            } else {
                setLoading(false);
            }
        }
    }

    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isSending, setIsSending] = React.useState(false);
    const [status, setStatus] = React.useState("initial")
    const [loading, setLoading] = React.useState(true);

    const submitForm = React.useCallback(sendData, [username, password, isSending]);

    React.useEffect(isAuth, [status]);

    if (loading || isSending) {
        return (
            <div>
                <h6>Loading...</h6>
            </div>
        )
    } else if (status === "logged") {
        return <Redirect to="/"/>
    } else if (status === "register") {
        return <Redirect to="/register"/>
    } else if (status === "reset") {
        return <Redirect to="/reset-password"/>
    } else return (
        <div className="z-0 w-full h-full" id="grad">
            <div className="z-10 container py-32 mx-auto flex justify-center">
                <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={submitForm}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm mb-2">
                            Username or Email
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            name="username" type="text" placeholder="Username" onChange={e => setUsername(e.target.value)}/>
                    </div>
                    <div className="mb-2">
                        <label className="block text-gray-700 text-sm mb-2">
                            Password
                        </label>
                        <input
                            className="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" name="password" type="password" onChange={e => setPassword(e.target.value)}/>
                    </div>
                    <div>
                        <label className="block text-red-500 text-md mb-4">Error</label>
                    </div>
                    <div className="flex justify-center mb-4">
                        <button
                            className="h-1/2 bg-orange-400 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none shadow"
                            type="submit" disabled={isSending || loading}>
                            Log In
                        </button>
                    </div>
                    <div className="flex justify-center mb-4">
                        <button
                            className="h-1/2 bg-orange-400 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none shadow"
                            onClick={e => setStatus('register')}disabled={isSending || loading}>
                            Create Account
                        </button>
                    </div>
                    <div className="flex justify-center mb-4">
                        <button
                            className="h-1/2 bg-orange-400 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none shadow"
                            onClick={e => setStatus('reset')}disabled={isSending || loading}>
                            I Forgot
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};