import csv
from country_iso2ify import get_resolver

resolver = get_resolver()

input_file = "businesses.csv"
output_file = "businesses_with_iso2.csv"

with open(input_file, newline="", encoding="utf-8") as f_in, \
    open(output_file, "w", newline="", encoding="utf-8") as f_out:

    reader = csv.reader(f_in)
    writer = csv.writer(f_out)

    header = next(reader)
    writer.writerow(header + ["country_iso2"])

    for row in reader:
        country = row[0].strip().strip('"')
        iso2 = ""
        if country:
            iso2 = resolver.resolve(country) or ""
            if not iso2:
                print(f"LookupError: {country}")
        writer.writerow(row + [iso2])
