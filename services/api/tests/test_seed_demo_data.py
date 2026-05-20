import importlib


def test_seed_script_exposes_main_entrypoint():
    seed_module = importlib.import_module("scripts.seed_demo_data")

    assert callable(seed_module.main)
