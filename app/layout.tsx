import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vivek Y.",
  description: "Personal site of Vivek Yarlagedda.",
  metadataBase: new URL("https://vivekyarla.com"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Auto-dark after sunset in San Francisco. Runs synchronously before paint to avoid flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var now=new Date();
var lat=37.7749, lon=-122.4194;
var start=new Date(Date.UTC(now.getUTCFullYear(),0,0));
var doy=Math.floor((now-start)/86400000);
var decl=23.45*Math.sin((360/365)*(doy-81)*Math.PI/180);
var dRad=decl*Math.PI/180, lRad=lat*Math.PI/180;
var cosH=-Math.tan(lRad)*Math.tan(dRad);
if(cosH>=-1&&cosH<=1){
  var H=Math.acos(cosH)*180/Math.PI;
  var noonUTC=12-lon/15;
  var sunrise=noonUTC-H/15, sunset=noonUTC+H/15;
  var u=now.getUTCHours()+now.getUTCMinutes()/60;
  if(u<sunrise||u>sunset) document.documentElement.classList.add('invert');
}
}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="mx-auto w-full max-w-2xl px-6 sm:px-8 pt-12 sm:pt-24 flex-1 flex flex-col">
          <main className="flex-1 pb-20">{children}</main>
          <footer className="py-6 text-[0.7rem] text-muted/60 text-center">
            © {new Date().getFullYear()} Vivek Yarlagedda
          </footer>
        </div>
      </body>
    </html>
  );
}
