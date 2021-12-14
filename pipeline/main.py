import inna_pipeline
import jonatan_pipeline

def massive_print(s):
    print("="*20)
    print(s.upper())
    print("="*20)

if __name__ == '__main__':

    massive_print("Beginning Inna pipeline")
    inna_pipeline.main()
    massive_print("Ending Inna pipeline")

    massive_print("Beginning Jonatan pipeline")
    jonatan_pipeline.main()
    massive_print("Ending Jonatan pipeline")

    print("\nDATA EXTRACTION COMPLETE\n")

