import { nextui } from "@nextui-org/react";
import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.tsx",
        "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
    ],

    plugins: [
        nextui({
            layout: {
                disabledOpacity: "0.3", // opacity-[0.3]

                borderWidth: {
                    small: "1px", // border-small
                    medium: "1.5px", // border-medium
                    large: "2px", // border-large
                },
            },
            themes: {
                light: {
                    colors: {
                        danger: {
                            50: "#fef2f2",
                            100: "#fee2e2",
                            200: "#fecaca",
                            300: "#fca5a5",
                            400: "#f87171",
                            500: "#ef4444",
                            600: "#dc2626",
                            700: "#b91c1c",
                            800: "#991b1b",
                            900: "#7f1d1d",
                            DEFAULT: "#ef4444",
                            // foreground: "#ffffff",
                        },
                        // focus: "#F182F6",
                    },
                },
                dark: {
                    colors: {
                        background: "#0D001A",
                        foreground: "#ffffff",
                        primary: {
                            50: "#3B096C",
                            100: "#520F83",
                            200: "#7318A2",
                            300: "#9823C2",
                            400: "#c031e2",
                            500: "#DD62ED",
                            600: "#F182F6",
                            700: "#FCADF9",
                            800: "#FDD5F9",
                            900: "#FEECFE",
                            DEFAULT: "#DD62ED",
                            foreground: "#ffffff",
                        },
                        focus: "#F182F6",
                    },
                },
            },
        }),
    ],
};
