import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import GeoTheme from "@/components/GeoTheme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vivek Y.",
  description:
    "Stanford student studying Economics & Computer Science — learning about frontier markets, post-AGI governance, and predictive decision modeling.",
  metadataBase: new URL("https://vivekyarla.com"),
  openGraph: {
    siteName: "Vivek Yarlagedda",
    type: "website",
    url: "https://vivekyarla.com",
    title: "Vivek Yarlagedda",
    description:
      "Stanford student studying Economics & Computer Science — learning about frontier markets, post-AGI governance, and predictive decision modeling.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@vivekyarla",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://pbs.twimg.com" />
        <link rel="preconnect" href="https://abs.twimg.com" />
        <link rel="dns-prefetch" href="https://cdn.syndication.twimg.com" />
        {/* Sunset dark mode, viewer-local. Runs before paint: manual toggle
            (sessionStorage) wins; else cached IP coords (localStorage); else
            an estimate from the viewer's UTC offset. GeoTheme refines after
            load with real coordinates. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var o=null;try{o=sessionStorage.getItem('themeOverride');}catch(e){}
if(o==='dark'){document.documentElement.classList.add('dark');return;}
if(o==='light'){return;}
function apply(lat,lon){
  var now=new Date();
  var start=Date.UTC(now.getUTCFullYear(),0,0);
  var doy=Math.floor((now.getTime()-start)/864e5);
  var decl=23.45*Math.sin((360/365)*(doy-81)*Math.PI/180);
  var cosH=-Math.tan(lat*Math.PI/180)*Math.tan(decl*Math.PI/180);
  var dark;
  if(cosH>=1){dark=true;}
  else if(cosH<=-1){dark=false;}
  else{
    var H=Math.acos(cosH)*180/Math.PI;
    var noonUTC=12-lon/15;
    var sunrise=noonUTC-H/15, sunset=noonUTC+H/15;
    var u=now.getUTCHours()+now.getUTCMinutes()/60+now.getUTCSeconds()/3600;
    var dayLen=((sunset-sunrise)%24+24)%24;
    var since=((u-sunrise)%24+24)%24;
    dark=since>=dayLen;
  }
  document.documentElement.classList.toggle('dark',dark);
}
window.__applySunTheme=apply;
var lat=37, lon=-(new Date().getTimezoneOffset()/60)*15;
try{var s=localStorage.getItem('geo');if(s){var g=JSON.parse(s);
if(g&&isFinite(g.lat)&&isFinite(g.lon)){lat=g.lat;lon=g.lon;}}}catch(e){}
apply(lat,lon);
}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <GeoTheme />
        <div className="mx-auto w-full max-w-2xl px-6 sm:px-8 flex-1 flex flex-col">
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="py-6 text-[0.7rem] text-muted/60 text-center">
            © {new Date().getFullYear()} Vivek Yarlagedda
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
