terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

resource "aws_instance" "soundtrack" {
  ami           = var.ami_id
  instance_type = "t3.micro"
  tags = { Name = "CodeAlive" }
}

output "studio_ip" {
  value = aws_instance.soundtrack.public_ip
}
