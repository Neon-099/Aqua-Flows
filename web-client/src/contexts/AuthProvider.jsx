import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
   const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export const AuthProvider = ({ children} ) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading ] = useState(true);

    //CHECK IF USE IS LOGGED IN ON MOUNT
    useEffect(() => {
        const checkUser = async() => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch('/api/v1/auth/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    credentials: 'include'
                })
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
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });
        //LIMITATION RATE FOR AUTH PAGE
        if (res.status === 429) {
            return { success: false, error: "Too many attempts. Please try again later after 15 minutes." };
        }
        const data = await res.json();
        if(res.ok){
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            setUser(data.user);
            return { success: true, role: data?.user?.role, user: data.user };
        }
        return {success: false, error: data.error || data.message};
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
        credentials: 'include',
        body: JSON.stringify(userData)
    })
        const data = await res.json();
        if(res.ok){
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            setUser(data.user);
            return { success: true, role: data?.user?.role, user: data.user };
        }
        return {success: false, error: data.error || data.message};
    }
    catch (error) {
        return {success: false, error: error.message};
    }
}


const logout = async () => {
    try {
        await fetch ('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
        localStorage.removeItem('authToken');
        setUser(null);
    }
    catch(error){
        console.error(error);
    }
}

const forgotPassword = async (email) => {
    try {
        const res = await fetch('/api/v1/auth/forgotpassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
            return { success: true, message: data.message };
        }
        
        return { success: false, error: data.error || 'Couldnt find email' };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

const resetPassword = async (resetToken, password) => {
    try {
        const res = await fetch(`/api/v1/auth/resetpassword/${resetToken}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (res.ok) {
            return { success: true, message: data.message };
        }
        return { success: false, error: data.error || data.message };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const value = {
    user,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout,
    loading
}

return (
    <AuthContext.Provider value={value}>
        {!loading && children}
    </AuthContext.Provider>
    )   
}
