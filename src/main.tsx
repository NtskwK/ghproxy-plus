import { BrowserRouter } from 'react-router-dom';
import './main.css';
import './index.css';
import './globals.css';

import Homepage from './pages';
import Header from './components/header';
import Footer from './components/footer';

export function Main() {
  return (
    <>
      <body className="font-sans antialiased">
        <Header />
        <BrowserRouter>
          <Homepage />
        </BrowserRouter>
        <Footer />
      </body>
    </>
  );
}
