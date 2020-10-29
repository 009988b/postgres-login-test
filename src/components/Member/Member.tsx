import React from 'react';
import axios from 'axios';
import auth from '../../Auth';

export default function Member()
{
    const [loading, setLoading] = React.useState(true);
    const [logged, setLogged] = React.useState(false);

    React.useEffect(() => {
        axios.get("http://localhost:5000/", {
            headers: {
                'Authorization' : 'Bearer ' + localStorage.getItem('jwt')
            }
        }).then(res => {
            if (res.status === 200) {
                setLogged(true);
                setLoading(false);
            } else if (res.status === 401) {
                setLoading(false);
            }
        }).catch(e => {
            console.error(e);
            setLoading(false);
        })
    }, []);

    const logOut = React.useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        localStorage.setItem('jwt','');
        localStorage.setItem('username','');
        auth.acc_name = '';
        auth.token = '';
        setLogged(false);
    }, [])

    if (loading) {
        return (
            <div>
                <h6>Loading...</h6>
            </div>
        )
    } else {
        if (logged) {
            return (
                <div>
                    <div className="mb-4 block">
                        <h1>You are logged in as {localStorage.getItem('username')}</h1>
                    </div>
                    <div className="mb-6 block">
                        <button
                            className="h-1/2 bg-orange-400 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={logOut} disabled={loading}>
                            Log out
                        </button>
                    </div>
                </div>
            )
        }
        return (
            <div>
                <h1>You are not currently logged in.</h1>
                <form method="get" action="/login">
                    <button
                        className="h-1/2 bg-orange-400 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        type="submit" disabled={loading}>
                        Take me
                    </button>
                </form>
            </div>
        )
    }

}
