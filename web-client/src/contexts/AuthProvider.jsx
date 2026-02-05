import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children} ) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading ] = useState(true);

    //CHECK IF USE IS LOGGED IN ON MOUNT
    useEffect(() => {
        const checkUser = async() => {
            try {
                const res = await fetch('/api/v1/auth/me')
                if(res.ok){
                    const data = await res.json();
                    setUser(data.user);
                }
            }
            catch(error) {
                console.error('Not authenticated')
            }
            finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);


const login = async ( email, password ) => {
    try {
        const res = await fetch('/api/v1/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if(res.ok){
            setUser(data.user);
            return { success: true};
        }
        return {success: false, error: data.message};
    }
    catch (error){
        return { success: false, error: error.message};
    }
} 

const register = async (userData) => {
    try {
        const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(userData)
    })
        const data = await res.json();
        if(res.ok){
            setUser(data.user);
            return{success: true};
        }
        return {success: false, error: data.message};
    }
    catch (error) {
        return {success: false, error: error.message};
    }
}


const logout = async () => {
    try {
        await fetch ('/api/v1/auth/logout', { method: 'POST'})
        setUser(null);
    }
    catch(error){
        console.error(error);
    }
}

const value = {
    user,
    login,
    register,
    logout,
    loading
}

return (
    <AuthContext.Provider value={value}>
        {!loading && children}
    </AuthContext.Provider>
    )   
}

