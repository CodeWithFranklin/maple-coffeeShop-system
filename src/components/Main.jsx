import Header from "./Header";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { usePrevNextButtons } from "./hooks/usePrevNextButtons";
import { useVerticalCarousel } from "./hooks/useVerticalCarousel";
import { NextButton, PrevButton } from "./embela/EmblaCarouselArrowButtons";

export default function Main() {
  const slides = [
    <div className="h-53 w-80 p-5 rounded-4xl flex flex-col bg-blue-300 bg-[url('/images/wiggle.svg')] bg-no-repeat bg-size-[auto_100px]">
      <p className="text-3xl text-gray-800 font-extrabold h-[85%]">
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
    <div className="h-53 w-80 p-5 rounded-4xl flex flex-col bg-blue-400 bg-[url('/images/wiggle.svg')] bg-no-repeat bg-size-[auto_100px]">
      <p className="text-3xl  text-gray-800 font-extrabold h-[85%]">
        Can't wait tell my friends all about this place
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

    <div className="h-53 w-80 p-5 rounded-4xl flex flex-col bg-blue-400 bg-[url('/images/wiggle.svg')] bg-no-repeat bg-size-[auto_100px]">
      <p className="text-3xl  text-gray-800 font-extrabold h-[85%]">
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

    <div className="h-53 w-80 p-5 rounded-4xl flex flex-col bg-blue-500 bg-[url('/images/wiggle.svg')] bg-no-repeat bg-size-[auto_100px]">
      <p className="text-3xl  text-gray-800 font-extrabold h-[85%]">
        i could stay here until my lunch break is over
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
  const [horizontalaRef, horizontalApi] = useEmblaCarousel({ loop: true });
  const [verticalRef, verticalApi] = useEmblaCarousel(
    { axis: "y", loop: true },
    [Autoplay({ delay: 5000 })]
  );

  // Pass emblaApi to the vertical carousel hook
  const { selectedIndex, scrollSnaps, scrollTo } =
    useVerticalCarousel(verticalApi);

  // Pass emblaApi to the prev/next hook for controls
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(horizontalApi);

  const images = ["/images/coffee.jpg", "/images/pizza.jpg"];

  return (
    <section className="bg-purple-50 overflow-x-hidden">
      <Header />
      <div className="min-h-[570px]">
        <section className="min-h-fit flex flex-col lg:flex-row mx-auto w-[87%]">
          <div className="min-h-fit min-w-[64%] lg:mt-13 mt-8">
            <div className="lg:w-[80%] w-full">
              <p className="lg:text-[100px] text-[52px] font-extrabold box-decoration-clone leading-[1.2] ">
                Get the best of your day from us!
              </p>
              <div className="lg:w-[92%] w-[92%] text-gray-500">
                <p className="text-xl mt-6 font-semibold">
                  The flavour, the comfort, the moments that you deserve. <br />
                </p>
                <p className="">save up to 20% off your first order.</p>
              </div>

              <div className="badge badge-soft border-0 py-[23px] pe-0 font-semibold px-5 mt-6 bg-lime-300 rounded-3xl">
                <a href="">
                  Our Services?
                  <span className="avatar rounded-full aspect-square bg-blue-40 ms-2 min-w-9 justify-center items-center">
                    <i className="bx bx-right-top-arrow-circle bx-lg"></i>
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-7 w-full mt-8 lg:ps-15">
            <div className="bg-blue-300 w-[90%] lg:w-full lg:h-[250px] h-[230px] rounded-4xl relative ps-5 overflow-hidden flex flex-col justify-center">
              <div className="lg:text-4xl text-3xl font-extrabold w-[45%]">
                <p className="text-white">weekly pick!</p>
                <p className="text-yellow-400 mt-2">13$</p>
              </div>

              <img
                src="/images/ad-image-2.png"
                className="lg:w-60 w-52 absolute right-[-10px] bottom-0 "
                alt=""
              />

              <div className="flex gap-x-1 items-center mt-3 w-fit">
                <button className="mt-2 font-bold border-0 btn h-7 rounded-2xl gap-x-1">
                  Explore
                </button>
                <button
                  className="btn rounded-full border-0 text-center mt-2 pt-1 w-10 aspect-square tooltip tooltip-top bg-lime-300"
                  data-tip="add to cart"
                >
                  <i className="bx bx-heart bx-sm"></i>
                </button>
              </div>
            </div>

            <div className="bg-purple-300 lg:h-[250px] h-[240px] w-[90%] lg:w-full self-end pt-5 ps-5 bg-[url('/images/i-like-food.svg')] bg-size-[160px] lg:bg-size-[185px] bg-no-repeat bg-position-[left_9rem_top_7.6rem] lg:bg-position-[left_11.4rem_top_7.1rem]">
              <div className="avatar-group -space-x-2 lg:h-9 h-8 lg:w-fit w-26 mt-1 float-right me-3">
                <div className="avatar w-9 border-1">
                  <div>
                    <img src="https://img.daisyui.com/images/profile/demo/batperson@192.webp" />
                  </div>
                </div>
                <div className="avatar w-9 border-1">
                  <div>
                    <img src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp" />
                  </div>
                </div>
                <div className="avatar w-9 border-1">
                  <div>
                    <img src="https://img.daisyui.com/images/profile/demo/averagebulk@192.webp" />
                  </div>
                </div>
                <div className="avatar avatar-placeholder w-9 border-1">
                  <div className="text-black bg-white text-xs font-bold">
                    <span>
                      10k<i className="text-orange-400">+</i>
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-4xl lg:text-[40px] font-extrabold w-[60%] leading-[1.2] h-[150px] mt-5">
                <span className="text-lime-200">"</span>will big foot love
                coffee?<span className="text-lime-200">"</span>
              </p>
              <button className="btn h-8 rounded-xl mt-0 lg:mt-2 border-0 bg-orange-200 ">
                Check out
              </button>
            </div>
          </div>
        </section>
        <section className="min-h-fit mt-25 mx-auto w-[85%] lg:w-[80%]">
          <div className="flex flex-col lg:flex-row justify-between gap-x-10">
            <div className="w-[full] lg:w-[45%] flex justify-center flex-col ">
              <p className="text-4xl lg:text-5xl pb-2 lg:w-[90%] w-full font-extrabold box-decoration-clone leading-[1.2]">
                Maple is so more than just coffee{""}
              </p>
              <p className="mt-2 mb-2 text-md lg:text-[18px] lg:w-[85%] w-[95%] text-gray-500">
                Have a look at some of our various services we offer, we make
                every visit count.
              </p>
            </div>
            <div className="min-h-fit lg:h-[150px] lg:w-[45%] py-5 flex gap-y-5 lg:gap-y-0 gap-x-7 lg:gap-x-5 lg:justify-end flex-wrap items-center">
              <p className="badge font-semibold py-[16px] flex items-center rounded-4xl bg-sky-100 text-green-900 border-0">
                Cafe
                <i className="bx bx-sm bx-coffee-togo"></i>
              </p>
              <p className="badge font-semibold py-[16px] flex items-center rounded-4xl bg-yellow-200 text-yellow-900 border-0">
                Delivery Service
                <i className="bx bx-sm bxs-truck"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl border-0">
                Co-work-Hub
                <i className="bx bx-sm bxs-group"></i>
              </p>
              <p className="badge font-semibold py-[16px] flex items-center rounded-4xl bg-green-100 text-green-900 border-0">
                Library
                <i className="bx bx-sm bxs-book"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                Lounge
                <i className="bx bx-sm bxs-drink"></i>
              </p>
              <p className="badge badge-soft font-semibold py-[16px] flex items-center rounded-4xl bg-lime-200 text-lime-900 border-0">
                Spa
                <i className="bx bx-sm mx-1 bxs-spa"></i>
              </p>
            </div>
          </div>
        </section>
        <section
          className="flex lg:flex-row flex-col-reverse lg:w-[80%] w-[90%] mx-auto mt-20 items-center 
        lg:gap-y-0 gap-y-10 lg:py-13 py-10 px-5 lg:px-0 lg:ps-10 shadow-xl rounded-4xl bg-white"
        >
          <div className="gap-10">
            {/* Carousel container */}
            <div
              className="w-full h-[270px] overflow-hidden rounded-3xl relative"
              ref={verticalRef}
            >
              {/* Slides */}
              <div className="flex flex-col h-full w-full ">
                {images.map((src, index) => (
                  <div
                    key={index}
                    className="flex-[0_0_100%] h-full w-full relative"
                  >
                    <img
                      src={src}
                      alt=""
                      className="object-cover flex-[0_0_100%] w-full h-full rounded-4xl"
                    />
                  </div>
                ))}
              </div>

              {/* Vertical badges (like dots) */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 ">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                      index === selectedIndex ? "bg-white" : "bg-gray-400/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:w-[55%] mx-auto flex lg:justify-center">
            <div className="lg:w-[70%]">
              <p className="text-4xl font-extrabold ">
                Book your experience with us today!
              </p>
              <p className="mt-4 lg:text-[17px] w-[95%] text-md text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ut
                sequi, impedit.
              </p>
              <ul className="font-semibold text-gray-600 mt-2">
                <li className="flex">
                  <i class="bx bx-badge-check me-1 mt-[5px] text-yellow-400"></i>
                  choose from dining, workspace, lounge or spa
                </li>
                <li className="flex">
                  <i class="bx bx-badge-check me-1 mt-[5px] text-yellow-400"></i>
                  easy online booking
                </li>
                <li className="flex">
                  <i class="bx bx-badge-check me-1 mt-[5px] text-yellow-400"></i>
                  flexible time slots to fit your schedule
                </li>
              </ul>
              <button className="bg-lime-300 btn rounded-4xl pe-1 mt-3 border-0">
                Book a space!{" "}
                <span className="bg-black rounded-full avatar w-8 aspect-square flex items-center justify-center">
                  <i className="bx bx-right-arrow-alt bx-sm text-white"></i>
                </span>
              </button>
            </div>
          </div>
        </section>
        <section className="min-h-[500px] lg:mt-25 mt-17 flex justify-center">
          <div
            className="min-h-full flex flex-col justify-center items-center w-[95%] overflow-hidden
           py-10"
          >
            <div className="lg:w-[45%] flex flex-col justify-center items-center">
              <div className="badge border-gray-300 rounded-4xl lg:font-semibold font-extrabold mb-3 lg:px-5 px-3 py-[17px]">
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
                <div className="font-black text-gray-600">10.4K loved this</div>
              </div>
              <p className="text-4xl w-fit font-extrabold mt-2">
                We're cooking!
              </p>
              <p className="lg:w-150 w-[95%] text-center mt-4 mb-3 lg:text-[20px] text-[18px] lg:font-extralight font-bold text-gray-700">
                We are always looking out for your tastes that's why we serve
                the tastiest of our dishes for the best prices. Breakfast, lunch
                and dinner we are always here for you.
              </p>
            </div>
            <div className="lg:w-[90%] w-[95%] min-h-fit flex items-center flex-col mt-5 py-5">
              <div className="flex flex-wrap lg:flex-row flex-col gap-4 w-full justify-center">
                <div className="lg:w-[32%] h-65 ps-6 pt-3 pe-2 rounded-3xl bg-indigo-200 overflow-hidden">
                  <p className="text-3xl font-extrabold line-clamp-1">Pizza</p>
                  <div className="flex h-55">
                    <div className="w-[50%] grid">
                      <p className="font-black text-lime-300 text-3xl mb-3">
                        17$
                      </p>
                      <div className="flex gap-2 flex-wrap min-h-[20px]">
                        <p className="badge font-semibold text-[13px] h-[21px] flex items-center rounded-4xl badge-soft border-0">
                          Cafe
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                      </div>
                      <p
                        className="font-light text-sm mt-2 line-clamp-2 max-h-[40px]"
                        title="Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit."
                      >
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit.
                      </p>
                      <div className="flex gap-x-1 items-center pb-4">
                        <button className="mt-2 font-bold border-0 btn h-7 rounded-xl gap-x-1 bg-lime-300">
                          Place order
                        </button>
                        <button
                          className="btn rounded-full text-center mt-2 w-10 px-2 tooltip tooltip-top"
                          data-tip="view menu"
                        >
                          <i className="bx bxs-food-menu bx-sm"></i>
                        </button>
                      </div>
                    </div>
                    <div className="w-[48%] flex justify-center ">
                      <img
                        src="/images/pizza.jpg"
                        className="lg:h-[160px] h-[140px] aspect-square rounded-full"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:w-[32%] h-67 ps-6 pt-3 pe-2 rounded-3xl bg-indigo-200 overflow-hidden">
                  <p className="text-3xl font-extrabold line-clamp-1">Pizza</p>
                  <div className="flex h-55">
                    <div className="w-[50%] grid">
                      <p className="font-black text-lime-300 text-3xl mb-3">
                        17$
                      </p>
                      <div className="flex gap-2 flex-wrap min-h-[20px]">
                        <p className="badge font-semibold text-[13px] h-[21px] flex items-center rounded-4xl badge-soft border-0">
                          Cafe
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                      </div>
                      <p
                        className="font-light text-sm mt-2 line-clamp-2 max-h-[40px]"
                        title="Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit."
                      >
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit.
                      </p>
                      <div className="flex gap-x-1 items-center pb-4">
                        <button className="mt-2 font-bold border-0 btn h-7 rounded-xl gap-x-1 bg-lime-300">
                          Place order
                        </button>
                        <button
                          className="btn rounded-full text-center mt-2 w-10 px-2 tooltip tooltip-top"
                          data-tip="view menu"
                        >
                          <i className="bx bxs-food-menu bx-sm"></i>
                        </button>
                      </div>
                    </div>
                    <div className="w-[48%] flex justify-center ">
                      <img
                        src="/images/pizza.jpg"
                        className="lg:h-[160px] h-[140px] aspect-square rounded-full"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:w-[32%] h-67 ps-6 pt-3 pe-2 rounded-3xl bg-indigo-200 overflow-hidden">
                  <p className="text-3xl font-extrabold line-clamp-1">Pizza</p>
                  <div className="flex h-55">
                    <div className="w-[50%] grid">
                      <p className="font-black text-lime-300 text-3xl mb-3">
                        17$
                      </p>
                      <div className="flex gap-2 flex-wrap min-h-[20px]">
                        <p className="badge font-semibold text-[13px] h-[21px] flex items-center rounded-4xl badge-soft border-0">
                          Cafe
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                      </div>
                      <p
                        className="font-light text-sm mt-2 line-clamp-2 max-h-[40px]"
                        title="Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit."
                      >
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit.
                      </p>
                      <div className="flex gap-x-1 items-center pb-4">
                        <button className="mt-2 font-bold border-0 btn h-7 rounded-xl gap-x-1 bg-lime-300">
                          Place order
                        </button>
                        <button
                          className="btn rounded-full text-center mt-2 w-10 px-2 tooltip tooltip-top"
                          data-tip="view menu"
                        >
                          <i className="bx bxs-food-menu bx-sm"></i>
                        </button>
                      </div>
                    </div>
                    <div className="w-[48%] flex justify-center ">
                      <img
                        src="/images/pizza.jpg"
                        className="lg:h-[160px] h-[140px] aspect-square rounded-full"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:w-[32%] h-67 ps-6 pt-3 pe-2 rounded-3xl bg-indigo-200 overflow-hidden">
                  <p className="text-3xl font-extrabold line-clamp-1">Pizza</p>
                  <div className="flex h-55">
                    <div className="w-[50%] grid">
                      <p className="font-black text-lime-300 text-3xl mb-3">
                        17$
                      </p>
                      <div className="flex gap-2 flex-wrap min-h-[20px]">
                        <p className="badge font-semibold text-[13px] h-[21px] flex items-center rounded-4xl badge-soft border-0">
                          Cafe
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                      </div>
                      <p
                        className="font-light text-sm mt-2 line-clamp-2 max-h-[40px]"
                        title="Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit."
                      >
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit.
                      </p>
                      <div className="flex gap-x-1 items-center pb-4">
                        <button className="mt-2 font-bold border-0 btn h-7 rounded-xl gap-x-1 bg-lime-300">
                          Place order
                        </button>
                        <button
                          className="btn rounded-full text-center mt-2 w-10 px-2 tooltip tooltip-top"
                          data-tip="view menu"
                        >
                          <i className="bx bxs-food-menu bx-sm"></i>
                        </button>
                      </div>
                    </div>
                    <div className="w-[48%] flex justify-center ">
                      <img
                        src="/images/pizza.jpg"
                        className="lg:h-[160px] h-[140px] aspect-square rounded-full"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:w-[32%] h-67 ps-6 pt-3 pe-2 rounded-3xl bg-indigo-200 overflow-hidden">
                  <p className="text-3xl font-extrabold line-clamp-1">Pizza</p>
                  <div className="flex h-55">
                    <div className="w-[50%] grid">
                      <p className="font-black text-lime-300 text-3xl mb-3">
                        17$
                      </p>
                      <div className="flex gap-2 flex-wrap min-h-[20px]">
                        <p className="badge font-semibold text-[13px] h-[21px] flex items-center rounded-4xl badge-soft border-0">
                          Cafe
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                      </div>
                      <p
                        className="font-light text-sm mt-2 line-clamp-2 max-h-[40px]"
                        title="Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit."
                      >
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit.
                      </p>
                      <div className="flex gap-x-1 items-center pb-4">
                        <button className="mt-2 font-bold border-0 btn h-7 rounded-xl gap-x-1 bg-lime-300">
                          Place order
                        </button>
                        <button
                          className="btn rounded-full text-center mt-2 w-10 px-2 tooltip tooltip-top"
                          data-tip="view menu"
                        >
                          <i className="bx bxs-food-menu bx-sm"></i>
                        </button>
                      </div>
                    </div>
                    <div className="w-[48%] flex justify-center ">
                      <img
                        src="/images/pizza.jpg"
                        className="lg:h-[160px] h-[140px] aspect-square rounded-full"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
                <div className="lg:w-[32%] h-67 ps-6 pt-3 pe-2 rounded-3xl bg-indigo-200 overflow-hidden">
                  <p className="text-3xl font-extrabold line-clamp-1">Pizza</p>
                  <div className="flex h-55">
                    <div className="w-[50%] grid">
                      <p className="font-black text-lime-300 text-3xl mb-3">
                        17$
                      </p>
                      <div className="flex gap-2 flex-wrap min-h-[20px]">
                        <p className="badge font-semibold text-[13px] h-[21px] flex items-center rounded-4xl badge-soft border-0">
                          Cafe
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                        <p className="badge badge-soft font-semibold text-[13px] h-[21px] flex items-center rounded-4xl bg-red-200 text-red-900 border-0">
                          Lounge
                        </p>
                      </div>
                      <p
                        className="font-light text-sm mt-2 line-clamp-2 max-h-[40px]"
                        title="Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit."
                      >
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit.orem ipsum dolor sit, amet consectetur adipisicing
                        elit.
                      </p>
                      <div className="flex gap-x-1 items-center pb-4">
                        <button className="mt-2 font-bold border-0 btn h-7 rounded-xl gap-x-1 bg-lime-300">
                          Place order
                        </button>
                        <button
                          className="btn rounded-full text-center mt-2 w-10 px-2 tooltip tooltip-top"
                          data-tip="view menu"
                        >
                          <i className="bx bxs-food-menu bx-sm"></i>
                        </button>
                      </div>
                    </div>
                    <div className="w-[48%] flex justify-center ">
                      <img
                        src="/images/pizza.jpg"
                        className="lg:h-[160px] h-[140px] aspect-square rounded-full"
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary mt-9 rounded-3xl h-8 text-warning gap-x-0">
                view more<i className="bx bx-chevron-right mt-1"></i>
              </button>
            </div>
          </div>
        </section>
        <section className="w-[100%] lg:w-[85%] mx-auto min-h-[200px] flex flex-col lg:flex-row mt-7 lg:mt-20">
          <div className="w-full lg:w-[47%] mb-8 ps-7">
            <p className="text-4xl lg:text-7xl w-fit font-extrabold leading-[1.2]">
              loved by many! 🤩
            </p>
            <p className="mt-3 text-gray-500 w-[85%] lg:w-[85%]">
              Our customers are our biggest fans, see what they have to say
              about us.
            </p>
          </div>

          {/* ✅ Embla carousel wrapper */}
          <div
            className="embla relative overflow-hidden ps-5 w-full h-[300px]"
            ref={horizontalaRef}
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
        <footer className="footer sm:footer-horizontal bg-neutral text-neutral-content grid-rows-2 pt-15 pb-7 mt-25 ps-7 lg:ps-25">
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
              <a href="#">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current hover:text-blue-400"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                </svg>
              </a>
              <a href="#">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current hover:text-red-500"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                </svg>
              </a>
              <a href="#">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  className="fill-current hover:text-blue-500"
                >
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                </svg>
              </a>
            </div>
          </nav>
          <nav>
            <h6 className="footer-title">Contact</h6>
            <div className="flex items-center">
              <p className="bg-primary rounded-full avatar w-8 aspect-square flex items-center justify-center me-2">
                <i className="bx bxs-phone bx-xs"></i>
              </p>
              <p>+234-785-986-564</p>
            </div>
            <div className="flex items-center">
              <p className="bg-primary rounded-full avatar w-8 aspect-square flex items-center justify-center me-2">
                <i className="bx bxs-envelope bx-xs"></i>
              </p>
              <p>MapleWorld@gamil.com</p>
            </div>
            <div className="flex items-center">
              <p className="bg-primary rounded-full avatar w-8 aspect-square flex items-center justify-center me-2">
                <i className="bx bxs-map bx-xs"></i>
              </p>
              <p>
                Lake wood street off simba close, behind morph hotel 5 Az B3SFT
              </p>
            </div>
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
