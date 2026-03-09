import { useEffect } from 'react';
import {
  ArrowUpRight,
  Clock3,
  Droplet,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Waves
} from 'lucide-react';
import { Link } from 'react-router-dom';

const contactCards = [
  {
    icon: Phone,
    title: 'Phone',
    value: '+63 923 456 7891',
    subtext: 'Mon-Sat, 9:00 AM to 6:00 PM'
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'hello@aquaflow.com',
    subtext: 'Replies within one business day'
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    value: '123 AquaFlow Street, Dagupan City, Pangasinan',
    subtext: 'Walk-ins are welcome'
  },
  {
    icon: Clock3,
    title: 'Service Hours',
    value: 'Monday-Saturday',
    subtext: '9:00 AM to 6:00 PM'
  }
];

const ContactUs = () => {
  useEffect(() => {
    const rootElements = ['html', 'body', '#root'];
    rootElements.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        el.style.margin = '0';
        el.style.padding = '0';
        el.style.width = '100vw';
        el.style.overflowX = 'hidden';
      }
    });
  }, []);

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900 via-sky-950 to-cyan-950 p-6 md:p-10">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-7">
              <Link to='/'>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <Waves className="h-4 w-4" />
                AquaFlow
              </div>
              </Link>
              

              <div>
                <h1 className="max-w-xl text-4xl font-black leading-tight text-white md:text-5xl">
                  Reach our team fast, and keep your home supply flowing.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
                  Need delivery support, billing help, or partnership details? Send a message and our team will get back with clear next steps.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {contactCards.map(item => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-cyan-200/40 hover:bg-white/10"
                    >
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-100/90">{item.title}</h2>
                      <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                      <p className="mt-1 text-xs text-slate-300">{item.subtext}</p>
                    </article>
                  );
                })}
              </div>

              <a
                href="#"
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
              >
                View FAQs before sending
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-cyan-950/40 md:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-200">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Message Center</p>
                  <h2 className="text-xl font-black text-white">Send Us a Note</h2>
                </div>
              </div>

              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">First name</span>
                    <input
                      type="text"
                      placeholder="First name"
                      className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/80"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">Last name</span>
                    <input
                      type="text"
                      placeholder="Last name"
                      className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/80"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">Mobile number</span>
                    <input
                      type="text"
                      placeholder="09xxxxxxxxx"
                      className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/80"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">Email address</span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/80"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-300">Message</span>
                  <textarea
                    rows="6"
                    placeholder="Tell us how we can help."
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/80"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black uppercase tracking-wide text-slate-950 transition hover:bg-cyan-200"
                >
                  Submit Message
                  <Send className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                <Droplet className="h-4 w-4 text-cyan-200" />
                We use your details only for support and order follow-up.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactUs;
