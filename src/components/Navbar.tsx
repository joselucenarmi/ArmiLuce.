@@ .. @@
 import React from 'react';
-import { Link } from 'react-router-dom';
+import { Link, useLocation } from 'react-router-dom';
 import { Home, Bell, Heart, User, LogOut, Search } from 'lucide-react';
 import { useAuth } from '../hooks/useAuth';
+import { SubscriptionStatus } from './SubscriptionStatus';
 
 export function Navbar() {
   const { user, signOut } = useAuth();
+  const location = useLocation();
 
   return (
@@ .. @@
         <div className="flex items-center space-x-6">
           {user ? (
             <>
+              <SubscriptionStatus />
               <Link
                 to="/dashboard"
-                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
+                className={`flex items-center space-x-1 transition-colors ${
+                  location.pathname === '/dashboard' 
+                    ? 'text-blue-600' 
+                    : 'text-gray-700 hover:text-blue-600'
+                }`}
               >
@@ .. @@
               <Link
                 to="/alerts"
-                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
+                className={`flex items-center space-x-1 transition-colors ${
+                  location.pathname === '/alerts' 
+                    ? 'text-blue-600' 
+                    : 'text-gray-700 hover:text-blue-600'
+                }`}
               >
@@ .. @@
               <Link
                 to="/favorites"
-                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
+                className={`flex items-center space-x-1 transition-colors ${
+                  location.pathname === '/favorites' 
+                    ? 'text-blue-600' 
+                    : 'text-gray-700 hover:text-blue-600'
+                }`}
               >
@@ .. @@
                 <span>Favoritos</span>
               </Link>
+              <Link
+                to="/pricing"
+                className={`flex items-center space-x-1 transition-colors ${
+                  location.pathname === '/pricing' 
+                    ? 'text-blue-600' 
+                    : 'text-gray-700 hover:text-blue-600'
+                }`}
+              >
+                <span>Precios</span>
+              </Link>
               <button
                 onClick={signOut}
                 className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition-colors"
@@ .. @@
           ) : (
             <Link
               to="/auth"
               className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
             >
               <User className="w-4 h-4" />
               <span>Iniciar Sesión</span>
             </Link>
           )}
         </div>
       </div>