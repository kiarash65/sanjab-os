//! نقطهٔ ورود دسکتاپ ویندوز — منطق در lib.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    sanjabos_lib::run()
}
