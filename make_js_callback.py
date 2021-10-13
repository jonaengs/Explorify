from argparse import ArgumentParser
import shutil

parser = ArgumentParser()
parser.add_argument("-c", "--callback", help="name of the callback function", required=True)
parser.add_argument("-f", "--file", help="file to make into a callback", required=True)
args = parser.parse_args()

out_file = "".join(args.file.split(".")[:-1]) + "_callback.js"
with open(args.file, mode="r", encoding="utf-8") as in_f:
    with open(out_file, mode="a+", encoding="utf-8") as out_f:
        out_f.write(args.callback + "(")
        shutil.copyfileobj(in_f, out_f)
        out_f.write(");")

