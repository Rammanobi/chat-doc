import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate("/"); // Redirect to chat page on successful login
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <header className="px-8 py-4">
        <h1 className="text-xl font-bold text-gray-800">ChatDoc</h1>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Log in or sign up</h2>
          <p className="text-gray-600 mb-8">
            You'll get smarter responses and can upload files, images, and more.
          </p>
          
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="relative mb-4 text-left">
              <label className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900" htmlFor="email">
                Email address
              </label>
              <input
                type="email"
                id="email"
                className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              Continue
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-sm text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              className="w-full bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="phone" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"></path></svg>
              Continue with phone
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.9 56.5l-63.4 61.3C334.2 95.8 293.6 80 248 80c-82.6 0-150.2 67.6-150.2 150.2S165.4 406.4 248 406.4c97.1 0 133.2-67.6 140-101.4h-140v-64h244.1c2.6 13.2 4.1 27.8 4.1 42.8z"></path></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </main>
      <footer className="text-center py-4">
        <p className="text-sm text-gray-600">
          <a href="#" className="hover:underline">Terms of Use</a>
          <span className="mx-2">|</span>
          <a href="#" className="hover:underline">Privacy Policy</a>
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
