import Header from "./Header";
import useEmblaCarousel from "embla-carousel-react";
import { usePrevNextButtons } from "./hooks/usePrevNextButtons";
import { useVerticalCarousel } from "./hooks/useVerticalCarousel";
import { NextButton, PrevButton } from "./embela/EmblaCarouselArrowButtons";

export default function Main() {
  const slides = [
    <div className="h-53 w-80 p-5 rounded-4xl flex flex-col bg-blue-300">
      <p className="text-3xl text-gray-800 font-bold h-[85%]">
        Never had such great service before
      </p>
      <div className="flex items-center">
        <div className="w-12 aspect-square avatar rounded-4xl bg-primary"></div>
        <div className="ms-1.5">
          <p className="font-bold text-sm">John Doe</p>{" "}
          <div>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
          </div>
        </div>
      </div>
    </div>,
    <div className="h-53 w-80 p-5 rounded-4xl flex flex-col bg-blue-400">
      <p className="text-3xl  text-gray-800 font-bold h-[85%]">
        Love working with my pals here
      </p>
      <div className="flex items-center">
        <div className="w-12 aspect-square avatar rounded-4xl bg-primary"></div>
        <div className="ms-1.5">
          <p className="font-bold text-sm">John Doe</p>{" "}
          <div>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
          </div>
        </div>
      </div>
    </div>,

    <div className="h-53 w-80 p-5 rounded-4xl flex flex-col bg-blue-400">
      <p className="text-3xl  text-gray-800 font-bold h-[85%]">
        Love working with my pals here
      </p>
      <div className="flex items-center">
        <div className="w-12 aspect-square avatar rounded-4xl bg-primary"></div>
        <div className="ms-1.5">
          <p className="font-bold text-sm">John Doe</p>{" "}
          <div>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
          </div>
        </div>
      </div>
    </div>,

    <div className="h-53 w-80 p-5 rounded-4xl flex flex-col bg-blue-500">
      <p className="text-3xl  text-gray-800 font-bold h-[85%]">
        i could stay here forever
      </p>
      <div className="flex items-center">
        <div className="w-12 aspect-square avatar rounded-4xl bg-primary"></div>
        <div className="ms-1.5">
          <p className="font-bold text-sm">John Doe</p>{" "}
          <div>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
            <i className="bx bxs-star text-warning"></i>
          </div>
        </div>
      </div>
    </div>,
  ];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);
  return (
    <section>
      <Header />
      <div className="min-h-[570px]">
        <section className="min-h-fit flex mx-auto w-[87%]">
          <div className="min-h-fit min-w-[64%] mt-20">
            <div className="w-[80%]">
              <p className="text-8xl font-extrabold box-decoration-clone leading-[1.1]">
                Get the best of your day from us!
              </p>
              <div className="w-[92%] text-gray-500">
                <p className="text-xl mt-6 font-semibold">
                  The flavour, the comfort, the moments that you deserve. <br />
                </p>
                <p className="">save up to 20% off your first order.</p>
              </div>

              <div className="badge badge-soft py-[23px] pe-0 font-semibold px-5 mt-6 bg-success rounded-3xl">
                <a href="">
                  Our Services?
                  <span className="avatar rounded-full aspect-square bg-blue-40 ms-2 min-w-9 justify-center items-center">
                    <i className="bx bx-right-top-arrow-circle bx-lg"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-7 w-full mt-15 ps-15">
            <div className="bg-primary h-[50%] rounded-4xl"></div>
            <div className="bg-indigo-400 h-[50%] rounded-4xl"></div>
          </div>
        </section>
        <section className="min-h-fit mt-25 mx-auto w-[80%]">
          <div className="flex justify-between gap-x-10">
            <div className="w-[45%] flex justify-center flex-col">
              <p className="text-5xl pb-2 w-[90%] font-extrabold box-decoration-clone leading-[1.1]">
                Maple is so more than just coffee{""}
                <span className="text-warning">
                  <i className="bx bxs-coffee-bean bx-md"></i>
                </span>
              </p>
              <p className="mt-2 mb-2 text-[18px] w-[85%] text-gray-500">
                Have a look at some of our various services we offer, we make
                every visit count.
              </p>
            </div>
            <div className="h-[150px] py-5 flex gap-x-5 justify-end flex-wrap items-center w-[55%]">
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl">
                Cafe & Dinning
                <i className="bx bx-sm mx-1 bx-restaurant"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl">
                Delivery Service
                <i className="bx bx-sm mx-1 bxs-truck"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl">
                Co-work-Hub
                <i className="bx bx-sm mx-1 bxs-group"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl">
                Library
                <i className="bx bx-sm mx-1 bxs-book"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl">
                Lounge
                <i className="bx bx-sm mx-1 bxs-drink"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl">
                Spa
                <i className="bx bx-sm mx-1 bxs-spa"></i>
              </p>
            </div>
          </div>
        </section>
        <section className="flex w-[80%] mx-auto mt-20">
          
          <div className="bg-emerald-400 w-[45%] min-h-[300px] max-h-[300px] rounded-4xl border border-t-5 overflow-x-hidden">
            <div className="bg-accent w-full h-full fle overflow-y-clip ">
          
              <div>
                 <img
                src="/images/coffee.jpg"
                className="object-cover h-full w-full"
                alt=""
              />
              </div>
               <div>
                 <img
                src="/images/pizza.jpg"
                className="object-cover h-full w-full"
                alt=""
              />
              </div>
             
            </div>
          </div>
          <div className="w-[55%] mx-auto flex justify-center">
            <div className="w-[70%]">
              <p className="text-4xl font-extrabold">
                Book your experience with us today!
              </p>
              <p className="mt-4 text-[18px]">
                Whether you're looking for a cozy spot to work, a relaxing
                lounge to unwind, or a refreshing spa experience, we've got you
                covered.
              </p>
              <ul className="font-extralight text-gray-600 mt-2">
                <li>
                  <i class="bx bx-badge-check text-amber-300 me-1"></i>choose
                  from dining, workspace, lounge or spa
                </li>
                <li>
                  <i class="bx bx-badge-check text-amber-300 me-1"></i>Easy
                  online booking
                </li>
                <li>
                  <i class="bx bx-badge-check text-amber-300 me-1"></i>Flexible
                  time slots to fit your schedule
                </li>
              </ul>
              <button className="bg-primary btn text-white rounded-4xl pe-1 mt-3">
                Book a space!{" "}
                <span className="bg-black rounded-full avatar w-8 aspect-square flex items-center justify-center">
                  <i className="bx bx-right-arrow-alt bx-sm"></i>
                </span>
              </button>
            </div>
          </div>
        </section>
        <section className="min-h-[500px] mt-25 flex justify-center">
          <div
            className="min-h-full flex flex-col justify-center items-center w-[95%] rounded-[70px] overflow-hidden
           py-10"
          >
            <div className="w-[45%] flex flex-col justify-center items-center">
              <div className="badge border-gray-300 rounded-4xl font-semibold mb-3 px-5 py-[17px]">
                {" "}
                <div className="text-warning">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="inline-block h-8 w-6 stroke-current"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    ></path>
                  </svg>
                </div>
                <div className="font-bold">10.4K loved this</div>
              </div>
              <p className="text-4xl w-fit font-extrabold text-center">
                We're cooking!
              </p>
              <p className="w-130 text-center mt-4 mb-3 text-[20px] font-extralight">
                We are always looking out for your tastes that's why we serve
                the tastiest of our dishes for the best prices. Breakfast, lunch
                and dinner we are always here for you.
              </p>
            </div>
            <div className="w-[90%] min-h-fit flex items-center flex-col mt-5 py-5">
              <div className="flex justify-between w-[85%]">
                <div className="flex flex-col justify-center items-center">
                  <div className="flex justify-center relative">
                    <div className="w-40 aspect-square avatar overflow-hidden rounded-full">
                      <img src="/images/pizza.jpg" alt="pizza" />
                    </div>
                    <div className="absolute btn h-7 min-w-12 rounded bottom-[-10px] flex flex-row justify-center items-center px-1 gap-x-0.5 text-[12px] font-extrabold text-gray-700">
                      4.7k<i className="bx bx-heart bx-xs text-warning"></i>
                    </div>
                  </div>
                  <div className="w-70 text-center mt-5">
                    <p className="font-bold">Pizza</p>
                    <p className="text-gray-600">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit
                      sit amet consectetur adipisicing elit.
                    </p>
                    <button className="mt-2 pe-0 ps-2 text-center btn btn-soft h-7 rounded-full gap-x-1">
                      Place order{" "}
                      <i class="bx bxs-plus-circle bx-sm mt-[3px]"></i>{" "}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center">
                  <div className="flex justify-center relative">
                    <div className="w-40 aspect-square avatar overflow-hidden rounded-full">
                      <img src="/images/pizza.jpg" alt="pizza" />
                    </div>
                    <div className="absolute btn h-7 min-w-12 rounded bottom-[-10px] flex flex-row justify-center items-center px-1 gap-x-0.5 text-[12px] font-extrabold text-gray-700">
                      4.7k<i className="bx bx-heart bx-xs text-warning"></i>
                    </div>
                  </div>
                  <div className="w-70 text-center mt-5">
                    <p className="font-bold">Pizza</p>
                    <p className="text-gray-600">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit
                      sit amet consectetur adipisicing elit.
                    </p>
                    <button className="mt-2 pe-0 ps-2 text-center btn btn-soft h-7 rounded-full gap-x-1">
                      Place order{" "}
                      <i class="bx bxs-plus-circle bx-sm mt-[3px]"></i>{" "}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center">
                  <div className="flex justify-center relative">
                    <div className="w-40 aspect-square avatar overflow-hidden rounded-full">
                      <img src="/images/pizza.jpg" alt="pizza" />
                    </div>
                    <div className="absolute btn h-7 min-w-12 rounded bottom-[-10px] flex flex-row justify-center items-center px-1 gap-x-0.5 text-[12px] font-extrabold text-gray-700">
                      4.7k<i className="bx bx-heart bx-xs text-warning"></i>
                    </div>
                  </div>
                  <div className="w-70 text-center mt-5">
                    <p className="font-bold">Pizza</p>
                    <p className="text-gray-600">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit
                      sit amet consectetur adipisicing elit.
                    </p>
                    <button className="mt-2 pe-0 ps-2 text-center btn btn-soft h-7 rounded-full gap-x-1">
                      Place order{" "}
                      <i class="bx bxs-plus-circle bx-sm mt-[3px]"></i>{" "}
                    </button>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary mt-9 rounded-3xl h-8 text-warning gap-x-0">
                view more<i className="bx bx-chevron-right mt-1"></i>
              </button>
            </div>
          </div>
        </section>
        <section className="w-[85%] mx-auto min-h-[200px] flex mt-20">
          <div className="w-[30%]">
            <p className="text-7xl w-90 font-extrabold leading-[1.2]">
              loved by many! 🤩
            </p>
            <p className="mt-3 text-gray-500 w-[85%]">
              Our customers are our biggest fans. See what they have to say
              about us.
            </p>
          </div>

          {/* ✅ Embla carousel wrapper */}
          <div
            className="embla relative overflow-hidden ps-5 w-fit h-[300px]"
            ref={emblaRef}
          >
            {/* ✅ Embla container */}
            <div className="embla__container flex flex-nowrap gap-x-6 px-6">
              {slides.map((slide, index) => (
                <div key={index} className="embla__slide flex-none w-80 h-fit">
                  {slide}
                </div>
              ))}
            </div>

            {/* ✅ Buttons */}
            <PrevButton
              onClick={onPrevButtonClick}
              disabled={prevBtnDisabled}
            />
            <NextButton
              onClick={onNextButtonClick}
              disabled={nextBtnDisabled}
            />
          </div>
        </section>
        <footer className="footer sm:footer-horizontal bg-neutral text-neutral-content grid-rows-2 pt-15 mt-25 ps-25">
          <aside>
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              fillRule="evenodd"
              clipRule="evenodd"
              className="fill-current"
            >
              <path d="M22.672 15.226l-2.432.811.841 2.515c.33 1.019-.209 2.127-1.23 2.456-1.15.325-2.148-.321-2.463-1.226l-.84-2.518-5.013 1.677.84 2.517c.391 1.203-.434 2.542-1.831 2.542-.88 0-1.601-.564-1.86-1.314l-.842-2.516-2.431.809c-1.135.328-2.145-.317-2.463-1.229-.329-1.018.211-2.127 1.231-2.456l2.432-.809-1.621-4.823-2.432.808c-1.355.384-2.558-.59-2.558-1.839 0-.817.509-1.582 1.327-1.846l2.433-.809-.842-2.515c-.33-1.02.211-2.129 1.232-2.458 1.02-.329 2.13.209 2.461 1.229l.842 2.515 5.011-1.677-.839-2.517c-.403-1.238.484-2.553 1.843-2.553.819 0 1.585.509 1.85 1.326l.841 2.517 2.431-.81c1.02-.33 2.131.211 2.461 1.229.332 1.018-.21 2.126-1.23 2.456l-2.433.809 1.622 4.823 2.433-.809c1.242-.401 2.557.484 2.557 1.838 0 .819-.51 1.583-1.328 1.847m-8.992-6.428l-5.01 1.675 1.619 4.828 5.011-1.674-1.62-4.829z"></path>
            </svg>
            <p>
              ACME Industries Ltd.
              <br />
              Providing reliable tech since 1992
            </p>
          </aside>
          <nav>
            <h6 className="footer-title">Legal</h6>
            <a className="link link-hover">Terms of use</a>
            <a className="link link-hover">Privacy policy</a>
            <a className="link link-hover">Cookie policy</a>
          </nav>
          <nav>
            <h6 className="footer-title">Navigate</h6>
            <a className="link link-hover">About us</a>
            <a className="link link-hover">Jobs</a>
            <a className="link link-hover">Press kit</a>
          </nav>

          <nav>
            <h6 className="footer-title">Social</h6>
            <div className="grid grid-flow-col gap-4">
              <a>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </a>
              <a>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                </svg>
              </a>
              <a>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current"
                >
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                </svg>
              </a>
            </div>
          </nav>
          <nav>
            <h6 className="footer-title">Contact</h6>
            <a className="link link-hover">Features</a>
            <a className="link link-hover">Enterprise</a>
            <a className="link link-hover">Security</a>
            <a className="link link-hover">Pricing</a>
          </nav>
          <form>
            <h6 className="footer-title">Newsletter</h6>
            <p className="w-70">
              be the first to get new information and cool deals from us.
            </p>
            <fieldset className="w-80">
              <label>Enter your email address</label>
              <div className="join mt-1">
                <input
                  type="text"
                  placeholder="username@site.com"
                  className="input input-bordered join-item"
                />
                <button className="btn btn-primary join-item">Subscribe</button>
              </div>
            </fieldset>
          </form>
        </footer>
      </div>
    </section>
  );
}
