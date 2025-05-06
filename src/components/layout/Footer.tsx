
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Instagram, Facebook, Twitter, Mail, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  return <footer className="bg-slate-50 border-t border-slate-100 dark:bg-slate-900 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">E</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight dark:text-white">EquilibreON</span>
            </div>
            
            <p className="text-slate-600 text-sm mt-2 dark:text-slate-300">
              Transforme sua jornada alimentar com nutrição personalizada e inteligência artificial.
            </p>
            
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-brand-500 transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="mailto:contato@equilibreon.com" className="text-slate-400 hover:text-brand-500 transition-colors" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          {/* Links column 1 */}
          <div>
            <h4 className="font-semibold text-base mb-4 dark:text-white">Navegação</h4>
            <ul className="space-y-2">
              {['Sobre', 'Planos', 'Blog', 'Contato'].map(item => <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-slate-600 hover:text-brand-600 transition-colors text-sm dark:text-slate-300 dark:hover:text-brand-400">
                    {item}
                  </Link>
                </li>)}
            </ul>
          </div>
          
          {/* Links column 2 */}
          <div>
            <h4 className="font-semibold text-base mb-4 dark:text-white">Recursos</h4>
            <ul className="space-y-2">
              {['Artigos', 'Receitas', 'FAQ', 'Suporte'].map(item => <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-slate-600 hover:text-brand-600 transition-colors text-sm dark:text-slate-300 dark:hover:text-brand-400">
                    {item}
                  </Link>
                </li>)}
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-base mb-4 dark:text-white">Fique atualizado</h4>
            <p className="text-slate-600 text-sm mb-3 dark:text-slate-300">
              Inscreva-se para receber dicas e novidades sobre nutrição e bem-estar.
            </p>
            <div className="flex">
              <Input type="email" placeholder="Seu e-mail" className="rounded-r-none soft-input focus-visible:ring-0" />
              <Button type="submit" className="rounded-l-none bg-brand-600 hover:bg-brand-700">
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm text-center md:text-left dark:text-slate-400">
            © {new Date().getFullYear()} EquilibreOn. Todos os direitos reservados.
          </p>
          
          <div className="flex space-x-6">
            <Link to="/termos" className="text-slate-500 hover:text-brand-600 text-sm transition-colors dark:text-slate-400 dark:hover:text-brand-400">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="text-slate-500 hover:text-brand-600 text-sm transition-colors dark:text-slate-400 dark:hover:text-brand-400">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};

export default Footer;
