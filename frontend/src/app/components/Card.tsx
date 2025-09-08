import Image from "next/image";

interface CardProps {
  image: string;
  isSelected: boolean;
  onClick: () => void;
}

const Card = ({ image, isSelected, onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={`w-[300px] h-[400px] bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-lg cursor-pointer transition transform
        ${
          isSelected
            ? "scale-105 ring-4 ring-blue-500"
            : "hover:scale-105 hover:shadow-2xl"
        }`}
    >
      <Image
        src={image}
        alt="Avatar"
        width={250}
        height={250}
        className="rounded-lg object-cover"
      />
    </div>
  );
};

export default Card;
