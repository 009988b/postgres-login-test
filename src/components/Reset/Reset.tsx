import React from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import * as ev from 'email-validator';

export default function Reset() {
    const [status, setStatus] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [code, setCode] = React.useState('');
    const [recap, setRecap] = React.useState(false);
    const [error, setError] = React.useState('');

    const recapRef = React.useRef<ReCAPTCHA>(null);
    //const errorRef = React.useRef<>();

    const sendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (recapRef !== undefined) {
            if (ev.validate(email)) {
                setError(``)
                // @ts-ignore
                const token = await recapRef.current.executeAsync();
                const payload = {
                    email: email,
                    'g-recaptcha-response': token
                }
                const response = await axios.post("http://localhost:5000/mail-reset", payload, {
                    headers: {
                        'Content-Type': 'application/json',
                    }});
                if (response) {
                    setStatus('email-sent')
                }
            } else {
                setError(`${email}\n${ev.validate(email)}\nPlease enter a valid email address`)
            }
        }
    }

    const sendCode = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

    }

    const submitEmail = React.useCallback(sendEmail, [email]);

    //const submitCode = React.useCallback(sendCode, [code]);

    if (status === 'email-sent') {
        return (
            <div className="z-0 w-full h-full" id="grad">
            </div>
        );
    } else if (status === 'code-sent') {
        return (
            <div></div>
        );
    } else {
        return (
            <div className="z-0 w-full h-full" id="grad">
                <div className="z-10 container py-32 mx-auto flex justify-center">
                    <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={submitEmail}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm mb-2">
                                Email
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                name="email" type="text" placeholder="john.smith@aol.net" onChange={e => setEmail(e.target.value)}/>
                        </div>
                        <div className="mb-4">
                            <label className="block text-red-700 text-sm mb-2">
                                {error}
                            </label>
                            <ReCAPTCHA ref={recapRef} sitekey="6LcEEt8ZAAAAAFM5nNWDsPteW_9_UtmuBfY1wC-5" size="invisible" onChange={e => setRecap(!recap)}/>
                        </div>
                        <div className="flex justify-center mb-4">
                            <button className="h-1/2 bg-orange-400 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded focus:outline-none shadow" type="submit" disabled={status === 'sent'} onClick={e => submitEmail}>
                                Send Reset Code
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}