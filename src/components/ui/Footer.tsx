
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-950 text-gray-400 py-4 px-6 text-sm mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <img src="/lovable-uploads/3e58e801-ff4b-44b7-abd6-311e94a2a8d7.png" alt="LoCo Logo" className="w-8 h-8" />
          <span>© {currentYear} LoCo, Inc.</span>
        </div>
        
        <nav className="flex flex-wrap justify-center md:justify-end gap-x-6">
          <Link to="/terms-of-service" className="hover:text-gray-200 transition-colors">
            Terms
          </Link>
          <Link to="/privacy-policy" className="hover:text-gray-200 transition-colors">
            Privacy
          </Link>
          <Link to="/about" className="hover:text-gray-200 transition-colors">
            About
          </Link>
          <Link to="/" className="hover:text-gray-200 transition-colors">
            Home
          </Link>
          <a 
            href="#" 
            className="hover:text-gray-200 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              alert("Cookie preferences updated");
            }}
          >
            Manage cookies
          </a>
        </nav>
      </div>
    </footer>
  );
}
